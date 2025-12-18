import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google-auth';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow by redirecting to Google's consent screen
 */
export async function GET() {
  try {
    const authUrl = getAuthorizationUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}
