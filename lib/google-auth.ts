import { google, Auth } from 'googleapis';
import { prisma } from './prisma';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

/**
 * Converts Google Credentials to our GoogleTokens format
 */
function credentialsToTokens(credentials: Auth.Credentials): GoogleTokens {
  if (!credentials.access_token) {
    throw new Error('Missing access_token in credentials');
  }

  return {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || '',
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
    token_type: credentials.token_type || 'Bearer',
    scope: Array.isArray(credentials.scope) ? credentials.scope.join(' ') : (credentials.scope || SCOPES.join(' ')),
  };
}

/**
 * Creates OAuth2 client with credentials from environment
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * Generates the Google OAuth authorization URL
 */
export function getAuthorizationUrl(): string {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to ensure refresh token
  });

  return authUrl;
}

/**
 * Exchanges authorization code for tokens and stores them
 */
export async function handleOAuthCallback(code: string, userId: string) {
  const oauth2Client = getOAuth2Client();

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing required tokens from Google OAuth');
    }

    // Convert and store tokens in database
    const googleTokens = credentialsToTokens(tokens);
    await storeTokens(userId, googleTokens);

    return { success: true, tokens: googleTokens };
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Stores or updates OAuth tokens in database
 */
export async function storeTokens(userId: string, tokens: GoogleTokens) {
  const expiresAt = new Date(tokens.expiry_date);

  await prisma.googleCalendarAuth.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      updatedAt: new Date(),
    },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    },
  });
}

/**
 * Retrieves stored tokens for a user
 */
export async function getStoredTokens(userId: string) {
  return await prisma.googleCalendarAuth.findUnique({
    where: { userId },
  });
}

/**
 * Gets an authenticated OAuth2 client, refreshing token if needed
 */
export async function getAuthenticatedClient(userId: string) {
  const storedAuth = await getStoredTokens(userId);

  if (!storedAuth) {
    throw new Error('No stored credentials found. Please authenticate first.');
  }

  const oauth2Client = getOAuth2Client();

  // Set credentials
  oauth2Client.setCredentials({
    access_token: storedAuth.accessToken,
    refresh_token: storedAuth.refreshToken,
    expiry_date: storedAuth.expiresAt.getTime(),
    token_type: storedAuth.tokenType,
    scope: storedAuth.scope,
  });

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiryTime = storedAuth.expiresAt.getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiryTime - now < fiveMinutes) {
    console.log('Token expired or expiring soon, refreshing...');

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      if (credentials.access_token) {
        const googleTokens = credentialsToTokens(credentials);
        // Preserve existing refresh token if new one not provided
        if (!googleTokens.refresh_token) {
          googleTokens.refresh_token = storedAuth.refreshToken;
        }
        await storeTokens(userId, googleTokens);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh access token. Please re-authenticate.');
    }
  }

  return oauth2Client;
}

/**
 * Removes stored credentials for a user
 */
export async function revokeAccess(userId: string) {
  const storedAuth = await getStoredTokens(userId);

  if (storedAuth) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: storedAuth.accessToken,
    });

    try {
      // Revoke token with Google
      await oauth2Client.revokeCredentials();
    } catch (error) {
      console.error('Error revoking credentials:', error);
      // Continue to delete from database even if revocation fails
    }

    // Delete from database
    await prisma.googleCalendarAuth.delete({
      where: { userId },
    });

    // Delete sync status
    await prisma.syncStatus.deleteMany({
      where: { userId },
    });

    // Delete event mappings
    await prisma.calendarEventMapping.deleteMany({
      where: { calendarId: storedAuth.calendarId || '' },
    });
  }

  return { success: true };
}

/**
 * Checks if user has valid authentication
 */
export async function isAuthenticated(userId: string): Promise<boolean> {
  const storedAuth = await getStoredTokens(userId);
  return !!storedAuth;
}
