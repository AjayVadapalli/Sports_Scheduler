import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trophy, Users } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Sport } from '../types';
import { useAuth } from '../hooks/useAuth';

export function Sports() {
  const { user } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_players: 10
  });

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const data = await apiClient.getSports();
      setSports(data);
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySports = async () => {
    try {
      const url = new URL(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/sports?created_by=me`);
      const token = localStorage.getItem('token');
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      setSports(data);
    } catch (error) {
      console.error('Error fetching my sports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSport) {
        await apiClient.updateSport(editingSport.id.toString(), formData);
      } else {
        await apiClient.createSport(formData);
      }

      await fetchSports();
      resetForm();
    } catch (error) {
      console.error('Error saving sport:', error);
      // You might want to show an error message to the user here
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', max_players: 10 });
    setEditingSport(null);
    setShowForm(false);
  };

  const handleEdit = (sport: Sport) => {
    setFormData({
      name: sport.name,
      description: sport.description,
      max_players: sport.max_players
    });
    setEditingSport(sport);
    setShowForm(true);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Sports Management</h1>
          <p className="text-gray-600 mt-1">Create and manage available sports for sessions</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sport
            </button>
            <button
              onClick={fetchMySports}
              className="inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Show My Sports
            </button>
          </div>
        )}
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{sport.name}</h3>
                  <div className="flex items-center mt-1">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">Max {sport.max_players} players</span>
                  </div>
                </div>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => handleEdit(sport)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-gray-600 mt-3">{sport.description}</p>
          </div>
        ))}
      </div>

      {sports.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sports available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' 
              ? 'Get started by creating your first sport.' 
              : 'Check back later for available sports.'}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSport ? 'Edit Sport' : 'Create New Sport'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sport Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Basketball"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief description of the sport"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Players</label>
                <input
                  type="number"
                  required
                  min="2"
                  max="50"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingSport ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}