import express, { Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireOperator } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/orders
 * Get all orders with optional filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { orderType, materialType, startDate, endDate } = req.query;

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (orderType) {
      sql += ` AND order_type = $${paramIndex}`;
      params.push(orderType);
      paramIndex++;
    }

    if (materialType) {
      sql += ` AND material_type = $${paramIndex}`;
      params.push(materialType);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND order_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND order_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += ' ORDER BY order_date DESC, created_at DESC';

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id
 * Get a single order by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const {
      order_type,
      material_type,
      asset_type,
      model,
      quantity,
      warehouse,
      sales_order,
      employee_id,
      employee_name,
      serial_numbers,
      order_date,
      configuration,
      product,
      sd_card_size,
      profile_id,
    } = req.body;

    if (!order_type || !material_type || !asset_type || !model || !quantity || !warehouse) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = new Date().toISOString();
    const result = await query(
      `INSERT INTO orders (
        order_type, material_type, asset_type, model, quantity, warehouse,
        sales_order, employee_id, employee_name, serial_numbers, order_date,
        configuration, product, sd_card_size, profile_id,
        created_by, created_at, updated_by, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        order_type,
        material_type,
        asset_type,
        model,
        quantity,
        warehouse,
        sales_order || null,
        employee_id || null,
        employee_name || null,
        Array.isArray(serial_numbers) ? serial_numbers : null,
        order_date || now,
        configuration || null,
        product || 'Lead',
        sd_card_size || null,
        profile_id || null,
        req.user?.email || 'unknown_user',
        now,
        req.user?.email || 'unknown_user',
        now,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * PUT /api/orders/:id
 * Update an order
 */
router.put('/:id', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'order_type', 'material_type', 'asset_type', 'model', 'quantity',
      'warehouse', 'sales_order', 'employee_id', 'employee_name',
      'serial_numbers', 'order_date', 'configuration', 'product',
      'sd_card_size', 'profile_id',
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

    updateFields.push(`updated_by = $${paramIndex}`);
    updateValues.push(req.user?.email || 'unknown_user');
    paramIndex++;
    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;
    updateValues.push(id);

    const result = await query(
      `UPDATE orders 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order
 */
router.delete('/:id', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;

