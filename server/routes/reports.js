const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE s.date >= $1 AND s.date <= $2';
      params = [start_date, end_date];
    }

    // Get session statistics
    const sessionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN s.status = 'active' AND s.date < CURRENT_DATE THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_sessions,
        COUNT(CASE WHEN s.status = 'active' AND s.date >= CURRENT_DATE THEN 1 END) as upcoming_sessions
      FROM sessions s
      ${dateFilter}
    `, params);

    // Get total participants
    const participantStats = await pool.query(`
      SELECT COUNT(*) as total_participants
      FROM session_participants p
      JOIN sessions s ON p.session_id = s.id
      ${dateFilter.replace('s.date', 's.date')}
    `, params);

    // Get total sports
    const sportsStats = await pool.query('SELECT COUNT(*) as total_sports FROM sports');

    res.json({
      ...sessionStats.rows[0],
      total_participants: participantStats.rows[0].total_participants,
      total_sports: sportsStats.rows[0].total_sports
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sport popularity (admin only)
router.get('/sport-popularity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE s.date >= $1 AND s.date <= $2';
      params = [start_date, end_date];
    }

    const result = await pool.query(`
      SELECT 
        sp.name,
        COUNT(s.id) as count
      FROM sports sp
      LEFT JOIN sessions s ON sp.id = s.sport_id ${dateFilter}
      GROUP BY sp.id, sp.name
      ORDER BY count DESC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sport popularity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sessions by date (admin only)
router.get('/sessions-by-date', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE date >= $1 AND date <= $2';
      params = [start_date, end_date];
    }

    const result = await pool.query(`
      SELECT 
        date::text,
        COUNT(*) as count
      FROM sessions
      ${dateFilter}
      GROUP BY date
      ORDER BY date ASC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions by date:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;