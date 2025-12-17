import express, { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../config/database';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user exists in our database
          let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

          if (userResult.rows.length === 0) {
            // User doesn't exist - create them
            const insertResult = await query(
              'INSERT INTO users (email, role, department, account_type) VALUES ($1, $2, $3, $4) RETURNING *',
              [email, 'Viewer', null, 'Standard']
            );
            userResult = insertResult;
          }

          const user = userResult.rows[0];
          return done(null, {
            id: user.id || email,
            email: user.email,
            role: user.role,
            name: profile.displayName,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth login
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;

      if (!user || !user.email) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id || user.email,
        email: user.email,
        role: user.role,
      });

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user details from database
    let result = await query('SELECT * FROM users WHERE email = $1', [authReq.user.email]);

    // If user doesn't exist, create them (shouldn't happen, but handle gracefully)
    if (result.rows.length === 0) {
      const insertResult = await query(
        'INSERT INTO users (email, role, department, account_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [authReq.user.email, 'Viewer', null, 'Standard']
      );
      result = insertResult;
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id || authReq.user.email,
        email: user.email,
        role: user.role,
        department: user.department,
        account_type: user.account_type,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, this is just for consistency)
 */
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate new token
    const token = generateToken({
      id: authReq.user.id,
      email: authReq.user.email,
      role: authReq.user.role,
    });

    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;

