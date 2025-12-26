import express, { Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit = 50, offset = 0, unread_only = false } = req.query;
    
    let queryText = `
      SELECT n.*, a.name as asset_name, a.asset_id as asset_asset_id
      FROM notifications n
      LEFT JOIN assets a ON n.asset_id = a.id
      WHERE n.user_email = $1
    `;
    
    const queryParams: any[] = [authReq.user.email];
    let paramIndex = 2;

    if (unread_only === 'true') {
      queryText += ` AND n.is_read = false`;
    }

    queryText += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryText, queryParams);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_email = $1 AND is_read = false',
      [authReq.user.email]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Verify the notification belongs to the current user
    const checkResult = await query(
      'SELECT id FROM notifications WHERE id = $1 AND user_email = $2',
      [id, authReq.user.email]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = now() 
       WHERE id = $1 AND user_email = $2 
       RETURNING *`,
      [id, authReq.user.email]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
router.put('/read-all', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = now() 
       WHERE user_email = $1 AND is_read = false 
       RETURNING *`,
      [authReq.user.email]
    );

    res.json({ data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (internal use, typically called by other routes)
 */
router.post('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const {
      user_email,
      notification_type,
      asset_id,
      asset_name,
      asset_asset_id,
      assigned_to,
      employee_id,
      employee_name,
      action_by,
    } = req.body;

    if (!user_email || !notification_type || !asset_id || !action_by) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO notifications (
        user_email, notification_type, asset_id, asset_name, asset_asset_id,
        assigned_to, employee_id, employee_name, action_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        user_email,
        notification_type,
        asset_id,
        asset_name || null,
        asset_asset_id || null,
        assigned_to || null,
        employee_id || null,
        employee_name || null,
        action_by,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;

