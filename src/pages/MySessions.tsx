import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, X, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';
import { UserSession } from '../types';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO } from 'date-fns';

export function MySessions() {
  const { user } = useAuth();
  const [mySessions, setMySessions] = useState<UserSession[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingSession, setCancellingSession] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [leavingSession, setLeavingSession] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchMySessions();
    }
  }, [user]);

  const toLocalDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
      const [hh, mm, ss = '0'] = timeStr.split(':');
      return new Date(y, (m || 1) - 1, d, parseInt(hh || '0', 10), parseInt(mm || '0', 10), parseInt(ss || '0', 10));
    } catch {
      return parseISO(`${dateStr}T${timeStr}`);
    }
  };

  const fetchMySessions = async () => {
    try {
      const [createdSessions, joinedSessionsData] = await Promise.all([
        apiClient.getMyCreatedSessions(),
        apiClient.getMyJoinedSessions()
      ]);

      const mapSessionData = (session: any): UserSession => ({
        id: session.id,
        title: session.title,
        sport_name: session.sport_name,
        venue: session.venue,
        date: session.date,
        time: session.time,
        team_a: session.team_a,
        team_b: session.team_b,
        max_participants: session.max_participants,
        current_participants: session.current_participants,
        status: session.status,
        cancellation_reason: session.cancellation_reason,
        created_by_name: session.created_by_name,
        created_by: session.created_by,
      });

      setMySessions(createdSessions.map(mapSessionData));
      setJoinedSessions(joinedSessionsData.map(mapSessionData));
    } catch (error) {
      console.error('Error fetching my sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!cancellingSession || !cancellationReason.trim()) return;

    try {
      await apiClient.cancelSession(cancellingSession.toString(), cancellationReason);

      await fetchMySessions();
      setCancellingSession(null);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  const handleLeaveSession = async (sessionId: string) => {
    try {
      await apiClient.leaveSession(sessionId);
      await fetchMySessions();
      setLeavingSession(null);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession || !deletionReason.trim()) return;

    try {
      await apiClient.deleteSession(deletingSession.toString(), deletionReason);

      await fetchMySessions();
      setDeletingSession(null);
      setDeletionReason('');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(`Failed to delete session: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingCreated = mySessions.filter(session => {
    if (session.status !== 'active') return false;
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() > Date.now();
  });

  const upcomingJoined = joinedSessions.filter(session => {
    if (session.status !== 'active') return false;
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() > Date.now();
  });

  const pastCreated = mySessions.filter(session => {
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() <= Date.now();
  });

  const pastJoined = joinedSessions.filter(session => {
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() <= Date.now();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-600 mt-1">Manage your created and joined sports sessions</p>
      </div>

      {/* My Created Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sessions I Created ({upcomingCreated.length})
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {upcomingCreated.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{session.sport_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {session.current_participants}/{session.max_participants}
                  </span>
                  <button
                    onClick={() => setCancellingSession(session.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {(session.created_by === user?.id || user?.role === 'admin') && (
                    <button
                      onClick={() => setDeletingSession(session.id)}
                      className="ml-2 px-2 py-0.5 text-xs border rounded text-gray-600 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {session.venue}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(session.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {session.time}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">{session.team_a}</span> vs <span className="font-medium">{session.team_b}</span>
              </div>
            </div>
          ))}
        </div>

        {upcomingCreated.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions created</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first sports session to get started.
            </p>
          </div>
        )}
      </div>

      {/* Sessions I Joined */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sessions I Joined ({upcomingJoined.length})
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {upcomingJoined.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{session.sport_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created by {session.created_by_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {session.current_participants}/{session.max_participants}
                  </span>
                  <button
                    onClick={() => setLeavingSession(session.id)}
                    className="px-3 py-1 text-red-600 border border-red-300 rounded-md text-sm hover:bg-red-50 transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {session.venue}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(session.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {session.time}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">{session.team_a}</span> vs <span className="font-medium">{session.team_b}</span>
              </div>
            </div>
          ))}
        </div>

        {upcomingJoined.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No joined sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse available sessions to join your first game.
            </p>
          </div>
        )}
      </div>

      {/* Past Created Sessions */}
      {pastCreated.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions I Created</h2>
          <div className="space-y-4">
            {pastCreated.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{session.sport_name}</span>
                      <span>{session.venue}</span>
                      <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                      <span>{session.team_a} vs {session.team_b}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.status === 'cancelled' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                  </span>
                </div>
                {session.cancellation_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      <p className="text-sm text-red-700">{session.cancellation_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Joined Sessions */}
      {pastJoined.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions I Joined</h2>
          <div className="space-y-4">
            {pastJoined.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{session.sport_name}</span>
                      <span>{session.venue}</span>
                      <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                      <span>{session.team_a} vs {session.team_b}</span>
                      <span>Created by {session.created_by_name}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.status === 'cancelled' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                  </span>
                </div>
                {session.cancellation_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      <p className="text-sm text-red-700">{session.cancellation_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {cancellingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Cancel Session</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this session. Participants will be notified.
            </p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setCancellingSession(null);
                  setCancellationReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={handleCancelSession}
                disabled={!cancellationReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please provide a reason for deleting this session. If the session has participants, they will be removed from the session.
            </p>
            <textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Enter deletion reason..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setDeletingSession(null);
                  setDeletionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={!deletionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Session Modal */}
      {leavingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Leave Session</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to leave this session? You can rejoin later if there's still space.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setLeavingSession(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={() => handleLeaveSession(leavingSession.toString())}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}