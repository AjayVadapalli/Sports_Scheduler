import React, { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { UserSession, SessionStats } from '../types';
import { format } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    upcomingSessions: 0,
    totalParticipants: 0,
    totalSports: 0,
  });
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([]);
  const [joinedSessionsCount, setJoinedSessionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get stats
      const statsData = await apiClient.getStats();
      setStats({
        totalSessions: parseInt(statsData.total_sessions),
        completedSessions: parseInt(statsData.completed_sessions),
        cancelledSessions: parseInt(statsData.cancelled_sessions),
        upcomingSessions: parseInt(statsData.upcoming_sessions),
        totalParticipants: parseInt(statsData.total_participants),
        totalSports: parseInt(statsData.total_sports),
      });

      // Get recent sessions
      const sessions = await apiClient.getSessions();
      const recentSessionsData = sessions
        .filter((session: any) => session.status === 'active')
        .slice(0, 5)
        .map((session: any) => ({
          id: session.id,
          title: session.title,
          sport_name: session.sport_name,
          venue: session.venue,
          date: session.date,
          time: session.time,
          current_participants: session.current_participants,
          max_participants: session.max_participants,
          created_by_name: session.created_by_name,
          created_by: session.created_by,
          team_a: session.team_a,
          team_b: session.team_b,
          status: session.status,
        }));
      setRecentSessions(recentSessionsData);

      // Get joined sessions count for players
      if (user?.role === 'player') {
        const joinedSessions = await apiClient.getMyJoinedSessions();
        setJoinedSessionsCount(joinedSessions.length);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = user?.role === 'admin'
    ? [
        { name: 'Total Sessions', value: stats.totalSessions, icon: Calendar, color: 'blue' },
        { name: 'Upcoming Sessions', value: stats.upcomingSessions, icon: TrendingUp, color: 'green' },
        { name: 'Total Sports', value: stats.totalSports, icon: Trophy, color: 'purple' },
        { name: 'Total Participants', value: stats.totalParticipants, icon: Users, color: 'orange' },
      ]
    : [
        { name: 'Upcoming Sessions', value: stats.upcomingSessions, icon: Calendar, color: 'blue' },
        { name: 'Joined Sessions', value: joinedSessionsCount, icon: Users, color: 'green' },
        { name: 'Available Sports', value: stats.totalSports, icon: Trophy, color: 'purple' },
        { name: 'Completed Sessions', value: stats.completedSessions, icon: TrendingUp, color: 'orange' },
      ];

  const colorToClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  };

  return (
    <div className="space-y-8">
      <div className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {user?.role === 'admin' 
            ? 'Manage sports and monitor activity across the platform.' 
            : 'Discover and join exciting sports sessions in your area.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col xs:flex-row items-center xs:items-start sm:items-center">
                <div className={`p-2 rounded-lg ${colorToClasses[stat.color].bg} mb-2 xs:mb-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colorToClasses[stat.color].text}`} />
                </div>
                <div className="xs:ml-3 sm:ml-4 text-center xs:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Sessions</h3>
          <p className="text-xs sm:text-sm text-gray-600">Latest sports sessions created on the platform</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSessions.length === 0 ? (
            <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Get started by creating your first sports session.
              </p>
            </div>
          ) : (
            recentSessions.map((session) => (
              <div key={session.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{session.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                      <span className="text-xs sm:text-sm text-gray-500">{session.sport_name}</span>
                      <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px]">{session.venue}</span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(session.date), 'MMM d, yyyy')} at {session.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {session.current_participants}/{session.max_participants}
                    </span>
                    <Users className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {(session.created_by !== user?.id || user?.role === 'admin') && session.current_participants < session.max_participants && (
                        <button
                          onClick={async () => { await apiClient.joinSession(session.id.toString()); fetchDashboardData(); }}
                          className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                        >
                          Join
                        </button>
                      )}
                      {(session.created_by === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => setDeletingSession(session.id)}
                          className="px-2 sm:px-3 py-1 text-red-600 border border-red-300 rounded-md text-xs hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
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
                onClick={() => { setDeletingSession(null); setDeletionReason(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={async () => { 
                  if (!deletionReason.trim()) return; 
                  try {
                    await apiClient.deleteSession(deletingSession!.toString(), deletionReason); 
                    setDeletingSession(null); 
                    setDeletionReason(''); 
                    fetchDashboardData();
                  } catch (error) {
                    console.error('Error deleting session:', error);
                    alert(`Failed to delete session: ${error.message || 'Unknown error'}`);
                  }
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