const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all sports (optionally only those created by the current user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { created_by } = req.query;
    if (created_by === 'me') {
      const result = await pool.query(
        'SELECT * FROM sports WHERE created_by = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
      return res.json(result.rows);
    }

    const result = await pool.query('SELECT * FROM sports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sport (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, max_players } = req.body;

    if (!name || !description || !max_players) {
      return res.status(400).json({ error: 'Name, description, and max_players are required' });
    }

    const result = await pool.query(
      'INSERT INTO sports (name, description, max_players, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, max_players, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating sport:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Sport name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update sport (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, max_players } = req.body;

    const result = await pool.query(
      'UPDATE sports SET name = $1, description = $2, max_players = $3 WHERE id = $4 RETURNING *',
      [name, description, max_players, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating sport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;