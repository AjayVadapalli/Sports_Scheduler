import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';
import { UserSession, Sport, Session } from '../types';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO } from 'date-fns';

export function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  const toLocalDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
      const [hh, mm, ss = '0'] = timeStr.split(':');
      return new Date(y, (m || 1) - 1, d, parseInt(hh || '0', 10), parseInt(mm || '0', 10), parseInt(ss || '0', 10));
    } catch {
      return parseISO(`${dateStr}T${timeStr}`);
    }
  };
  const [formData, setFormData] = useState({
    sport_id: '',
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    team_a: '',
    team_b: '',
    max_participants: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsData, sportsData]: [Session[], Sport[]] = await Promise.all([
        apiClient.getSessions(),
        apiClient.getSports()
      ]);

      const mappedSessions: UserSession[] = sessionsData.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        sport_name: session.sport_name || '',
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
        participants: session.participants || [],
      }));

      setSessions(mappedSessions);
      setSports(sportsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiClient.createSession(formData);
      
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      await apiClient.joinSession(sessionId);
      
      await fetchData();
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession || !deletionReason.trim()) return;
    try {
      const response = await apiClient.deleteSession(deletingSession.toString(), deletionReason);
      await fetchData();
      setDeletingSession(null);
      setDeletionReason('');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(`Failed to delete session: ${error.message || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      sport_id: '',
      title: '',
      description: '',
      venue: '',
      date: '',
      time: '',
      team_a: '',
      team_b: '',
      max_participants: 10
    });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(session => {
    if (session.status !== 'active') return false;
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() > Date.now();
  });

  const pastSessions = sessions.filter(session => {
    const dt = toLocalDateTime(session.date, session.time);
    return dt.getTime() <= Date.now();
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sports Sessions</h1>
          <p className="text-gray-600 mt-1">Discover and join exciting sports activities</p>
        </div>
        <div className="flex space-x-2">
          
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </button>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {upcomingSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{session.sport_name}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
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

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {session.current_participants}/{session.max_participants} participants
                </div>
                {session.created_by !== user?.id && session.current_participants < session.max_participants && (
                  <button
                    onClick={() => handleJoinSession(session.id.toString())}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>

              {session.description && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                  {session.description}
                </p>
              )}

              {(session.created_by === user?.id || user?.role === 'admin') && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      // Removed console.log
                      setDeletingSession(session.id);
                    }}
                    className="px-3 py-1 text-red-600 border border-red-300 rounded-md text-sm hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}

              {Array.isArray(session.participants) && session.participants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Participants:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.participants.map((name) => (
                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {upcomingSessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to create a sports session!
            </p>
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions</h2>
          <div className="space-y-4">
            {pastSessions.map((session) => (
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

      {/* Delete Session Modal */}
      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Session (ID: {deletingSession})</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Provide a reason for deleting this session. If the session has participants, they will be removed from the session.
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
                  // Removed console.log
                  setDeletingSession(null); 
                  setDeletionReason(''); 
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={() => {
                  // Removed console.log
                  handleDeleteSession();
                }}
                disabled={!deletionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Session</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sport</label>
                  <select
                    required
                    value={formData.sport_id}
                    onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="50"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Session Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Friday Night Basketball"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional description of the session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Central Sports Complex"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team A</label>
                  <input
                    type="text"
                    required
                    value={formData.team_a}
                    onChange={(e) => setFormData({ ...formData, team_a: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Red Team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team B</label>
                  <input
                    type="text"
                    required
                    value={formData.team_b}
                    onChange={(e) => setFormData({ ...formData, team_b: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Blue Team"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {upcomingSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{session.sport_name}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {session.current_participants}/{session.max_participants}
                </span>
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

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>{session.team_a} vs {session.team_b}</span>
              </div>

              {(session.created_by !== user?.id || user?.role === 'admin') && session.current_participants < session.max_participants && (
                <button
                  onClick={() => handleJoinSession(session.id.toString())}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Join Session
                </button>
              )}

              {session.created_by === user?.id && user?.role !== 'admin' && (
                <div className="text-sm text-gray-500 mb-2">(Your session - cannot join)</div>
              )}

              {session.created_by === user?.id && user?.role === 'admin' && (
                <div className="text-sm text-blue-500 mb-2">(Your session - admin can join)</div>
              )}

              {session.current_participants >= session.max_participants && (
                <div className="text-sm text-red-500 mb-2">(Session is full)</div>
              )}

              {(session.created_by === user?.id || user?.role === 'admin') && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    {session.created_by === user?.id ? 'Your session' : 'Admin: Delete session'}
                    {session.current_participants > 0 && (
                      <span className="text-orange-500 ml-2">({session.current_participants} participants will be removed)</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      // Removed console.log
                      setDeletingSession(session.id);
                    }}
                    className="px-3 py-1 text-red-600 border border-red-300 rounded-md text-sm hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions</h2>
          <div className="space-y-4">
            {pastSessions.slice(0, 5).map((session) => (
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Session (ID: {deletingSession})</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Provide a reason for deleting this session. Sessions with participants cannot be deleted; cancel instead.
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
                  // Removed console.log
                  setDeletingSession(null); 
                  setDeletionReason(''); 
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={() => {
                  // Removed console.log
                  handleDeleteSession();
                }}
                disabled={!deletionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}