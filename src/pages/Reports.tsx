import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Trophy, TrendingUp } from 'lucide-react';
import { apiClient } from '../lib/api';
import { SessionStats, PopularityData, DateData } from '../types';

export function Reports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    upcomingSessions: 0,
    totalParticipants: 0,
    totalSports: 0
  });
  const [sportPopularity, setSportPopularity] = useState<PopularityData[]>([]);
  const [sessionsByDate, setSessionsByDate] = useState<DateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      // Get statistics
      const statsData = await apiClient.getStats(dateRange.start, dateRange.end);

      setStats({
        totalSessions: parseInt(statsData.total_sessions),
        completedSessions: parseInt(statsData.completed_sessions),
        cancelledSessions: parseInt(statsData.cancelled_sessions),
        upcomingSessions: parseInt(statsData.upcoming_sessions),
        totalParticipants: parseInt(statsData.total_participants),
        totalSports: parseInt(statsData.total_sports)
      });

      // Get sport popularity
      const popularityData = await apiClient.getSportPopularity(dateRange.start, dateRange.end);
      const sportPopularityData = popularityData.map((item: any) => ({
        name: item.name,
        count: parseInt(item.count)
      }));

      setSportPopularity(sportPopularityData);

      // Get sessions by date
      const dateData = await apiClient.getSessionsByDate(dateRange.start, dateRange.end);
      const sessionsByDateData = dateData.map((item: any) => ({
        date: item.date,
        count: parseInt(item.count)
      }));

      setSessionsByDate(sessionsByDateData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563EB', '#059669', '#EA580C', '#7C3AED', '#DC2626'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track sports activity and user engagement</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelledSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sport Popularity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sport Popularity</h3>
          {sportPopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sportPopularity}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sportPopularity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No data available for this period</p>
            </div>
          )}
        </div>

        {/* Sessions by Date Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions by Date</h3>
          {sessionsByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No sessions found for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}