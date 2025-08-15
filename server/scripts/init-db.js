const pool = require('../config/database');

const initDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('admin', 'player')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sports (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        max_players INTEGER NOT NULL DEFAULT 10 CHECK (max_players > 0),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        sport_id INTEGER NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        venue VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        team_a VARCHAR(255) NOT NULL,
        team_b VARCHAR(255) NOT NULL,
        max_participants INTEGER NOT NULL DEFAULT 10 CHECK (max_participants > 0),
        current_participants INTEGER NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_participants (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, user_id)
      )
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_sport_id ON sessions(sport_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id)');

    console.log('Database initialized successfully!');
    
    // Insert sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
};

const insertSampleData = async () => {
  try {
    // Check if admin user exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@example.com', hashedPassword, 'Admin User', 'admin']
      );
      
      console.log('Sample admin user created: admin@example.com / admin123');
    }

    // Check if sports exist
    const sportsCheck = await pool.query('SELECT COUNT(*) FROM sports');
    
    if (parseInt(sportsCheck.rows[0].count) === 0) {
      const sampleSports = [
        ['Basketball', 'Fast-paced team sport played on a court with hoops', 10],
        ['Football', 'Popular team sport played with an oval ball', 22],
        ['Tennis', 'Racket sport played on a rectangular court', 4],
        ['Volleyball', 'Team sport played with a net and ball', 12],
        ['Badminton', 'Racket sport played with a shuttlecock', 4]
      ];

      for (const [name, description, maxPlayers] of sampleSports) {
        await pool.query(
          'INSERT INTO sports (name, description, max_players) VALUES ($1, $2, $3)',
          [name, description, maxPlayers]
        );
      }
      
      console.log('Sample sports data inserted');
    }
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

initDatabase();