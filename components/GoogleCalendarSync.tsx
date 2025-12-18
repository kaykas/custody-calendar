'use client';

import { useEffect, useState } from 'react';

interface SyncStatus {
  isAuthenticated: boolean;
  syncStatus: string;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  totalEventsSynced: number;
  syncInProgress: boolean;
}

export default function GoogleCalendarSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Fetch sync status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/sync/google', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult(data.details);
        await fetchStatus(); // Refresh status
      } else {
        setError(data.message || 'Sync failed');
      }
    } catch (err) {
      setError('Failed to sync events');
      console.error('Sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect Google Calendar? This will remove all synced events.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sync/google', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchStatus();
        setSyncResult(null);
      } else {
        setError('Failed to disconnect');
      }
    } catch (err) {
      setError('Failed to disconnect');
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'success':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (syncStatus: string) => {
    switch (syncStatus) {
      case 'success':
        return 'Synced Successfully';
      case 'partial':
        return 'Partially Synced';
      case 'failed':
        return 'Sync Failed';
      case 'never_synced':
        return 'Not Yet Synced';
      default:
        return syncStatus;
    }
  };

  if (!status) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading sync status...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Google Calendar Sync
        </h2>
        <div className="flex items-center gap-2">
          {status.isAuthenticated ? (
            <span className="flex items-center text-green-600">
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Connected
            </span>
          ) : (
            <span className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Not Connected
            </span>
          )}
        </div>
      </div>

      {!status.isAuthenticated ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect your Google Calendar to automatically sync custody events.
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sync Status</p>
              <p className={`text-lg font-semibold ${getStatusColor(status.syncStatus)}`}>
                {getStatusText(status.syncStatus)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Synced</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(status.lastSyncAt)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Events Synced</p>
              <p className="text-lg font-semibold text-gray-900">
                {status.totalEventsSynced}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sync Progress</p>
              <p className="text-lg font-semibold text-gray-900">
                {status.syncInProgress ? 'In Progress...' : 'Idle'}
              </p>
            </div>
          </div>

          {status.lastSyncError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">
                Last Error:
              </p>
              <p className="text-sm text-red-700">{status.lastSyncError}</p>
            </div>
          )}

          {syncResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">
                Sync Completed Successfully
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-green-700">Total:</span>{' '}
                  <span className="font-semibold">{syncResult.totalEvents}</span>
                </div>
                <div>
                  <span className="text-green-700">Created:</span>{' '}
                  <span className="font-semibold">{syncResult.created}</span>
                </div>
                <div>
                  <span className="text-green-700">Updated:</span>{' '}
                  <span className="font-semibold">{syncResult.updated}</span>
                </div>
                <div>
                  <span className="text-green-700">Deleted:</span>{' '}
                  <span className="font-semibold">{syncResult.deleted}</span>
                </div>
              </div>
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-yellow-800">
                    Warnings:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {syncResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={loading || status.syncInProgress}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading || status.syncInProgress ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Sync Now
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Events are synced to a dedicated "Custody Calendar" in your
                  Google account
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Mother's time is blue, father's time is red for easy
                  identification
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Reminders are set for 1 day and 1 hour before each transition
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Changes in custody calendar automatically update Google
                  Calendar
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
