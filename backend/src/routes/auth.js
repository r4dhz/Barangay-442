const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'masid-default-secret';

// Helper: format user for response (strip password_hash)
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    status: row.status,
    profilePhoto: row.profile_photo,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns: { accessToken, user }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive or suspended.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

    // Log the login
    db.prepare(
      'INSERT INTO audit_logs (user_id, user_name, action, module, details) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, `${user.first_name} ${user.last_name}`, 'LOGIN', 'auth', 'User logged in successfully');

    const accessToken = generateToken(user);

    res.json({
      accessToken,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * POST /auth/register
 * Body: { email, password, firstName, lastName }
 * ALWAYS creates a RESIDENT account. Role cannot be set by client.
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 12);

    // ALWAYS resident - never trust client role input
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(email, passwordHash, firstName, lastName, 'resident', 'active');

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Also create a resident record
    db.prepare(
      'INSERT INTO residents (user_id, first_name, last_name, address) VALUES (?, ?, ?, ?)'
    ).run(newUser.id, firstName, lastName, 'Barangay 442, Sampaloc, Manila');

    // Log registration with Data Privacy Act compliance note
    db.prepare(
      'INSERT INTO audit_logs (user_id, user_name, action, module, details) VALUES (?, ?, ?, ?, ?)'
    ).run(newUser.id, `${firstName} ${lastName}`, 'REGISTER', 'auth', 'New resident account created (Consented to R.A. 10173 Data Privacy Policy)');

    const accessToken = generateToken(newUser);

    res.status(201).json({
      accessToken,
      user: formatUser(newUser),
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * GET /auth/me
 * Returns the current authenticated user.
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(formatUser(user));
  } catch (err) {
    console.error('[Auth] GetMe error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * POST /auth/refresh
 * Refreshes the JWT token.
 */
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid session.' });
    }

    const accessToken = generateToken(user);
    res.json({ accessToken, user: formatUser(user) });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
