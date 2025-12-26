import express, { Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireOperator } from '../middleware/authorize';
import { notifyAdminsAboutAssetChange } from '../services/notificationService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/assets
 * Get all assets with pagination support
 */
router.get('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const page = parseInt(authReq.query.page as string) || 1;
    const pageSize = parseInt(authReq.query.pageSize as string) || 1000;
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM assets');
    const total = parseInt(countResult.rows[0].count);

    // Get paginated assets
    const result = await query(
      `SELECT * FROM assets 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/assets/all
 * Get all assets without pagination (for bulk operations)
 */
router.get('/all', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const result = await query(
      'SELECT * FROM assets ORDER BY created_at DESC'
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching all assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/assets/:id
 * Get a single asset by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = authReq.params;
    const result = await query('SELECT * FROM assets WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

/**
 * POST /api/assets
 * Create a new asset
 */
router.post('/', requireOperator, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const {
      asset_id,
      name,
      type,
      brand,
      configuration,
      serial_number,
      far_code,
      provider,
      location,
      status = 'Available',
      assigned_to,
      employee_id,
      assigned_date,
      warranty_start,
      warranty_end,
      warranty_status,
      asset_value_recovery,
      asset_condition,
      created_by,
    } = authReq.body;

    // Validate required fields
    if (!asset_id || !name || !type || !brand || !serial_number || !location) {
      return res.status(400).json({
        error: 'Missing required fields: asset_id, name, type, brand, serial_number, location',
      });
    }

    // Check for duplicate asset_id or serial_number
    const duplicateCheck = await query(
      `SELECT id FROM assets 
       WHERE asset_id = $1 OR serial_number = $2`,
      [asset_id, serial_number]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Asset ID or Serial Number already exists',
      });
    }

    const now = new Date().toISOString();
    const result = await query(
      `INSERT INTO assets (
        asset_id, name, type, brand, configuration, serial_number, far_code,
        provider, location, status, assigned_to, employee_id, assigned_date,
        warranty_start, warranty_end, warranty_status, asset_value_recovery,
        asset_condition, created_by, created_at, updated_by, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        asset_id,
        name,
        type,
        brand,
        configuration || null,
        serial_number,
        far_code || null,
        provider || null,
        location,
        status,
        assigned_to || null,
        employee_id || null,
        assigned_date || null,
        warranty_start || null,
        warranty_end || null,
        warranty_status || null,
        asset_value_recovery || null,
        asset_condition || null,
        created_by || authReq.user?.email || 'unknown_user',
        now,
        authReq.user?.email || 'unknown_user',
        now,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({ error: 'Asset ID or Serial Number already exists' });
    }
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

/**
 * PUT /api/assets/:id
 * Update an asset
 */
router.put('/:id', requireOperator, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = authReq.params;
    const updates = req.body;

    // Check if asset exists
    const existingResult = await query('SELECT * FROM assets WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // If asset_id or serial_number is being updated, check for duplicates
    if (updates.asset_id || updates.serial_number) {
      const duplicateCheck = await query(
        `SELECT id FROM assets 
         WHERE id != $1 AND (asset_id = $2 OR serial_number = $3)`,
        [id, updates.asset_id || existingResult.rows[0].asset_id, updates.serial_number || existingResult.rows[0].serial_number]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Asset ID or Serial Number already exists',
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'asset_id', 'name', 'type', 'brand', 'configuration', 'serial_number',
      'far_code', 'provider', 'location', 'status', 'assigned_to', 'employee_id',
      'assigned_date', 'received_by', 'return_date', 'remarks', 'asset_check',
      'warranty_start', 'warranty_end', 'warranty_status', 'asset_value_recovery',
      'asset_condition', 'amc_start', 'amc_end',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Always update updated_by and updated_at
    updateFields.push(`updated_by = $${paramIndex}`);
    updateValues.push(authReq.user?.email || 'unknown_user');
    paramIndex++;
    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    // Add id for WHERE clause
    updateValues.push(id);

    const result = await query(
      `UPDATE assets 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      updateValues
    );

    const updatedAsset = result.rows[0];

    // Check if this is an assignment or return and notify admins
    const existingAsset = existingResult.rows[0];
    const wasAssigned = existingAsset.assigned_to || existingAsset.employee_id;
    const isNowAssigned = updatedAsset.assigned_to || updatedAsset.employee_id;

    // Asset assignment: was not assigned, now is assigned
    if (!wasAssigned && isNowAssigned) {
      // Get employee name if available
      let employeeName = null;
      if (updatedAsset.employee_id) {
        try {
          const empResult = await query(
            'SELECT employee_name FROM employees WHERE employee_id = $1',
            [updatedAsset.employee_id]
          );
          if (empResult.rows.length > 0) {
            employeeName = empResult.rows[0].employee_name;
          }
        } catch (error) {
          console.error('Error fetching employee name:', error);
        }
      }

      await notifyAdminsAboutAssetChange({
        notification_type: 'asset_assigned',
        asset_id: id,
        asset_name: updatedAsset.name,
        asset_asset_id: updatedAsset.asset_id,
        assigned_to: updatedAsset.assigned_to || null,
        employee_id: updatedAsset.employee_id || null,
        employee_name: employeeName,
        action_by: authReq.user?.email || 'unknown_user',
      });
    }
    // Asset return: was assigned, now is not assigned
    else if (wasAssigned && !isNowAssigned) {
      // Get employee name from previous assignment
      let employeeName = null;
      if (existingAsset.employee_id) {
        try {
          const empResult = await query(
            'SELECT employee_name FROM employees WHERE employee_id = $1',
            [existingAsset.employee_id]
          );
          if (empResult.rows.length > 0) {
            employeeName = empResult.rows[0].employee_name;
          }
        } catch (error) {
          console.error('Error fetching employee name:', error);
        }
      }

      await notifyAdminsAboutAssetChange({
        notification_type: 'asset_returned',
        asset_id: id,
        asset_name: updatedAsset.name,
        asset_asset_id: updatedAsset.asset_id,
        assigned_to: existingAsset.assigned_to || null,
        employee_id: existingAsset.employee_id || null,
        employee_name: employeeName,
        action_by: authReq.user?.email || 'unknown_user',
      });
    }

    res.json({ data: updatedAsset });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Asset ID or Serial Number already exists' });
    }
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset (only Super Admin)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    // Check if user is Super Admin
    if (authReq.user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete assets' });
    }

    const { id } = authReq.params;

    // Delete related edit history first
    await query('DELETE FROM asset_edit_history WHERE asset_id = $1', [id]);

    // Delete the asset
    const result = await query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

/**
 * POST /api/assets/:id/history
 * Log edit history for an asset
 */
router.post('/:id/history', requireOperator, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = authReq.params;
    const { field_changed, old_value, new_value } = req.body;

    if (!field_changed) {
      return res.status(400).json({ error: 'field_changed is required' });
    }

    const result = await query(
      `INSERT INTO asset_edit_history (asset_id, field_changed, old_value, new_value, changed_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        field_changed,
        old_value || null,
        new_value || null,
        authReq.user?.email || 'unknown_user',
        new Date().toISOString(),
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error logging edit history:', error);
    res.status(500).json({ error: 'Failed to log edit history' });
  }
});

/**
 * GET /api/assets/:id/history
 * Get edit history for an asset
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = authReq.params;
    const result = await query(
      `SELECT * FROM asset_edit_history 
       WHERE asset_id = $1 
       ORDER BY updated_at DESC`,
      [id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    res.status(500).json({ error: 'Failed to fetch edit history' });
  }
});

export default router;

