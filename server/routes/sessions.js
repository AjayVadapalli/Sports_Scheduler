const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all sessions with sport, creator info, and participant names
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        sp.name AS sport_name,
        u.name AS created_by_name,
        COALESCE(
          (
            SELECT ARRAY_AGG(u2.name ORDER BY u2.name)
            FROM session_participants p2
            JOIN users u2 ON p2.user_id = u2.id
            WHERE p2.session_id = s.id
          ),
          ARRAY[]::text[]
        ) AS participants
      FROM sessions s
      JOIN sports sp ON s.sport_id = sp.id
      JOIN users u ON s.created_by = u.id
      ORDER BY s.date ASC, s.time ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      sport_id,
      title,
      description,
      venue,
      date,
      time,
      team_a,
      team_b,
      max_participants
    } = req.body;

    if (!sport_id || !title || !venue || !date || !time || !team_a || !team_b || !max_participants) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const result = await pool.query(`
      INSERT INTO sessions (
        sport_id, title, description, venue, date, time, 
        team_a, team_b, max_participants, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `, [
      sport_id, title, description || '', venue, date, time,
      team_a, team_b, max_participants, req.user.id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join session
router.post('/:id/join', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const sessionId = req.params.id;
    const userId = req.user.id;

    // Check if session exists, is active, not in the past, and not owned by the user
    const sessionResult = await client.query(
      `SELECT * FROM sessions 
       WHERE id = $1 
         AND status = $2 
         AND (date > CURRENT_DATE OR (date = CURRENT_DATE AND time > CURRENT_TIME))`,
      [sessionId, 'active']
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Session not found, inactive, or already in the past' });
    }

    const session = sessionResult.rows[0];

    // Prevent joining your own session (unless admin)
    if (session.created_by === userId && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot join your own session' });
    }

    if (session.current_participants >= session.max_participants) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Session is full' });
    }

    // Check if user already joined
    const existingParticipant = await client.query(
      'SELECT id FROM session_participants WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (existingParticipant.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already joined this session' });
    }

    // Add participant
    await client.query(
      'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2)',
      [sessionId, userId]
    );

    // Update participant count
    await client.query(
      'UPDATE sessions SET current_participants = current_participants + 1 WHERE id = $1',
      [sessionId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Successfully joined session' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Leave session
router.delete('/:id/leave', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const sessionId = req.params.id;
    const userId = req.user.id;

    // Remove participant
    await client.query(
      'DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    // Update participant count
    await client.query(
      'UPDATE sessions SET current_participants = current_participants - 1 WHERE id = $1',
      [sessionId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Successfully left session' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Cancel session (creator only)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    if (!cancellation_reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    const result = await pool.query(
      'UPDATE sessions SET status = $1, cancellation_reason = $2 WHERE id = $3 AND created_by = $4 RETURNING *',
      ['cancelled', cancellation_reason, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session (creator only) - only allowed if no participants
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE /:id called with params:', req.params);
    console.log('DELETE /:id called with body:', req.body);
    console.log('DELETE /:id called with user:', req.user);
    
    const { id } = req.params;
    const { deletion_reason } = req.body || {};

    console.log('Session ID to delete:', id);
    console.log('Deletion reason:', deletion_reason);

    if (!deletion_reason || !deletion_reason.trim()) {
      console.log('Missing deletion reason');
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    // Check if session exists and user is authorized (creator or admin)
    const sessionCheck = await pool.query(
      'SELECT id, created_by FROM sessions WHERE id = $1',
      [id]
    );

    console.log('Session check result:', sessionCheck.rows);

    if (sessionCheck.rows.length === 0) {
      console.log('Session not found');
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionCheck.rows[0];
    const isCreator = session.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';

    console.log('Session creator:', session.created_by);
    console.log('Current user ID:', req.user.id);
    console.log('Current user role:', req.user.role);
    console.log('Is creator:', isCreator);
    console.log('Is admin:', isAdmin);

    if (!isCreator && !isAdmin) {
      console.log('User not authorized to delete session');
      return res.status(403).json({ error: 'Not authorized to delete this session' });
    }

    // Check if there are participants (for logging only)
    const participantCount = await pool.query(
      'SELECT COUNT(*)::int AS count FROM session_participants WHERE session_id = $1',
      [id]
    );

    console.log('Participant count:', participantCount.rows[0].count);

    // Delete session and all related data
    console.log('Deleting session and related data...');
    
    // Delete participants first (due to foreign key constraint)
    await pool.query('DELETE FROM session_participants WHERE session_id = $1', [id]);
    console.log('Deleted session participants');
    
    // Delete the session
    await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    console.log('Session deleted successfully');
    
    return res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's created sessions
router.get('/my-created', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        sp.name as sport_name
      FROM sessions s
      JOIN sports sp ON s.sport_id = sp.id
      WHERE s.created_by = $1
      ORDER BY s.date ASC, s.time ASC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching created sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's joined sessions
router.get('/my-joined', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        sp.name as sport_name,
        u.name as created_by_name
      FROM sessions s
      JOIN sports sp ON s.sport_id = sp.id
      JOIN users u ON s.created_by = u.id
      JOIN session_participants p ON s.id = p.session_id
      WHERE p.user_id = $1
      ORDER BY s.date ASC, s.time ASC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching joined sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session participants by session id
router.get('/:id/participants', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM session_participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.session_id = $1
      ORDER BY u.name ASC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching session participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;