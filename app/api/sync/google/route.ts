import { NextRequest, NextResponse } from 'next/server';
import { syncAllEvents, deleteGoogleEvent } from '@/lib/google-calendar';
import { revokeAccess, isAuthenticated } from '@/lib/google-auth';

/**
 * POST /api/sync/google
 * Triggers manual synchronization of all custody events to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const userId = process.env.DEFAULT_USER_ID || 'default-user';

    // Check authentication
    const authenticated = await isAuthenticated(userId);
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar' },
        { status: 401 }
      );
    }

    // Perform sync
    const result = await syncAllEvents(userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Synchronization completed',
        details: {
          totalEvents: result.totalEvents,
          created: result.created,
          updated: result.updated,
          deleted: result.deleted,
          errors: result.errors,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Synchronization failed',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize events' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/google
 * Disconnects Google Calendar integration and removes all synced events
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = process.env.DEFAULT_USER_ID || 'default-user';

    // Revoke access and clean up
    await revokeAccess(userId);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
