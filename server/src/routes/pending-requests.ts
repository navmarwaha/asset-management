import express, { Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/pending-requests
 * Get all pending requests (filtered by user role)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let sql = `
      SELECT 
        pr.*,
        json_build_object(
          'asset_id', a.asset_id,
          'name', a.name,
          'type', a.type,
          'brand', a.brand,
          'serial_number', a.serial_number,
          'configuration', a.configuration,
          'location', a.location,
          'status', a.status,
          'assigned_to', a.assigned_to,
          'employee_id', a.employee_id
        ) as assets
      FROM pending_requests pr
      LEFT JOIN assets a ON pr.asset_id = a.id
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Filter by user role - non-admins only see their own requests
    if (req.user?.role && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      sql += ` WHERE pr.requested_by = $${paramIndex}`;
      params.push(req.user.email);
      paramIndex++;
    }

    sql += ` ORDER BY pr.requested_at DESC`;

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/**
 * GET /api/pending-requests/count
 * Get count of pending requests
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM pending_requests WHERE status = $1',
      ['pending']
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
});

/**
 * GET /api/pending-requests/:id
 * Get a single pending request
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT 
        pr.*,
        json_build_object(
          'asset_id', a.asset_id,
          'name', a.name,
          'type', a.type,
          'brand', a.brand,
          'serial_number', a.serial_number,
          'configuration', a.configuration,
          'location', a.location,
          'status', a.status,
          'assigned_to', a.assigned_to,
          'employee_id', a.employee_id
        ) as assets
      FROM pending_requests pr
      LEFT JOIN assets a ON pr.asset_id = a.id
      WHERE pr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching pending request:', error);
    res.status(500).json({ error: 'Failed to fetch pending request' });
  }
});

/**
 * POST /api/pending-requests
 * Create a new pending request
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      request_type,
      asset_id,
      assign_to,
      employee_id,
      employee_email,
      return_remarks,
      return_location,
      return_status,
      asset_condition,
      received_by,
      asset_value_recovery,
    } = req.body;

    if (!request_type || !asset_id || !req.user?.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current asset state for return requests
    let originalAssignedTo = null;
    let originalEmployeeId = null;

    if (request_type === 'return') {
      const assetResult = await query('SELECT assigned_to, employee_id FROM assets WHERE id = $1', [asset_id]);
      if (assetResult.rows.length > 0) {
        originalAssignedTo = assetResult.rows[0].assigned_to;
        originalEmployeeId = assetResult.rows[0].employee_id;
      }
    }

    const now = new Date().toISOString();
    const result = await query(
      `INSERT INTO pending_requests (
        request_type, asset_id, requested_by, requested_at, status,
        assign_to, employee_id, employee_email,
        return_remarks, return_location, return_status, asset_condition,
        received_by, original_assigned_to, original_employee_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        request_type,
        asset_id,
        req.user.email,
        now,
        'pending',
        assign_to || null,
        employee_id || null,
        employee_email || null,
        return_remarks || null,
        return_location || null,
        return_status || null,
        asset_condition || null,
        received_by || null,
        originalAssignedTo,
        originalEmployeeId,
        now,
        now,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating pending request:', error);
    res.status(500).json({ error: 'Failed to create pending request' });
  }
});

/**
 * PUT /api/pending-requests/:id
 * Update a pending request (approve/reject/cancel)
 */
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approver_comments, rejection_reason, ...updates } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    updateFields.push(`status = $${paramIndex}`);
    updateValues.push(status);
    paramIndex++;

    if (status === 'approved') {
      updateFields.push(`approved_by = $${paramIndex}`);
      updateValues.push(req.user?.email || 'unknown_user');
      paramIndex++;
      updateFields.push(`approved_at = $${paramIndex}`);
      updateValues.push(now);
      paramIndex++;
      if (approver_comments) {
        updateFields.push(`approver_comments = $${paramIndex}`);
        updateValues.push(approver_comments);
        paramIndex++;
      }
    } else if (status === 'rejected') {
      if (rejection_reason) {
        updateFields.push(`rejection_reason = $${paramIndex}`);
        updateValues.push(rejection_reason);
        paramIndex++;
      }
    } else if (status === 'cancelled') {
      updateFields.push(`cancelled_by = $${paramIndex}`);
      updateValues.push(req.user?.email || 'unknown_user');
      paramIndex++;
      updateFields.push(`cancelled_at = $${paramIndex}`);
      updateValues.push(now);
      paramIndex++;
    }

    // Allow updating other fields
    const allowedFields = ['assign_to', 'employee_id', 'employee_email', 'return_location', 'return_status', 'asset_condition', 'return_remarks'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(now);
    paramIndex++;

    updateValues.push(id);

    const result = await query(
      `UPDATE pending_requests 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating pending request:', error);
    res.status(500).json({ error: 'Failed to update pending request' });
  }
});

/**
 * DELETE /api/pending-requests/:id
 * Delete a pending request
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Only allow deletion of own requests or by admin
    const checkResult = await query('SELECT requested_by FROM pending_requests WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isAdmin = req.user?.role === 'Super Admin' || req.user?.role === 'Admin';
    const isOwner = checkResult.rows[0].requested_by === req.user?.email;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }

    const result = await query('DELETE FROM pending_requests WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Request deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting pending request:', error);
    res.status(500).json({ error: 'Failed to delete pending request' });
  }
});

export default router;

