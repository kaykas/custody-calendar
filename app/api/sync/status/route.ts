import { NextRequest, NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/google-calendar';

/**
 * GET /api/sync/status
 * Returns current synchronization status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = process.env.DEFAULT_USER_ID || 'default-user';

    const status = await getSyncStatus(userId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sync status' },
      { status: 500 }
    );
  }
}
