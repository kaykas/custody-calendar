import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/google-auth';

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google with authorization code
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/?auth=error&message=No authorization code received',
        request.url
      )
    );
  }

  try {
    // For single-user deployment, use default user ID
    const userId = process.env.DEFAULT_USER_ID || 'default-user';

    // Exchange code for tokens and store
    await handleOAuthCallback(code, userId);

    // Redirect to success page
    return NextResponse.redirect(new URL('/?auth=success', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/?auth=error&message=${encodeURIComponent('Authentication failed')}`,
        request.url
      )
    );
  }
}
