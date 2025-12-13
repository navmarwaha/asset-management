import express, { Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY email');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/me
 * Get current user info
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [req.user.email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * GET /api/users/:email
 * Get user by email
 */
router.get('/:email', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, role, department, account_type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check for duplicate
    const duplicateCheck = await query('SELECT email FROM users WHERE email = $1', [email]);
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const now = new Date().toISOString();
    const result = await query(
      `INSERT INTO users (email, role, department, account_type, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, role || null, department || null, account_type || null, now]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/users/:email
 * Update a user
 */
router.put('/:email', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.params;
    const { role, department, account_type } = req.body;

    // Users can only update their own profile unless they're admin
    const isAdmin = req.user?.role === 'Super Admin' || req.user?.role === 'Admin';
    if (!isAdmin && req.user?.email !== email) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (role !== undefined && isAdmin) {
      updateFields.push(`role = $${paramIndex}`);
      updateValues.push(role);
      paramIndex++;
    }
    if (department !== undefined) {
      updateFields.push(`department = $${paramIndex}`);
      updateValues.push(department);
      paramIndex++;
    }
    if (account_type !== undefined && isAdmin) {
      updateFields.push(`account_type = $${paramIndex}`);
      updateValues.push(account_type);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(email);

    const result = await query(
      `UPDATE users 
       SET ${updateFields.join(', ')} 
       WHERE email = $${paramIndex} 
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:email
 * Delete a user (admin only)
 */
router.delete('/:email', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.params;

    // Prevent deleting yourself
    if (req.user?.email === email) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await query('DELETE FROM users WHERE email = $1 RETURNING *', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;

