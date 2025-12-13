import express, { Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireOperator } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/employees
 * Get all employees
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY employee_name');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * GET /api/employees/:id
 * Get employee by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM employees WHERE employee_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * POST /api/employees
 * Create a new employee
 */
router.post('/', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, employee_name, email, department, role } = req.body;

    if (!employee_id || !employee_name || !email) {
      return res.status(400).json({ error: 'Missing required fields: employee_id, employee_name, email' });
    }

    // Check for duplicate
    const duplicateCheck = await query('SELECT employee_id FROM employees WHERE employee_id = $1', [employee_id]);
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    const now = new Date().toISOString();
    const result = await query(
      `INSERT INTO employees (employee_id, employee_name, email, department, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [employee_id, employee_name, email, department || null, role || null, now, now]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * POST /api/employees/bulk
 * Create multiple employees
 */
router.post('/bulk', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'employees array is required' });
    }

    const now = new Date().toISOString();
    const created: any[] = [];
    const errors: any[] = [];

    for (const emp of employees) {
      try {
        if (!emp.employee_id || !emp.employee_name || !emp.email) {
          errors.push({ employee: emp, error: 'Missing required fields' });
          continue;
        }

        // Check for duplicate
        const duplicateCheck = await query('SELECT employee_id FROM employees WHERE employee_id = $1', [emp.employee_id]);
        if (duplicateCheck.rows.length > 0) {
          errors.push({ employee: emp, error: 'Employee ID already exists' });
          continue;
        }

        const result = await query(
          `INSERT INTO employees (employee_id, employee_name, email, department, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [emp.employee_id, emp.employee_name, emp.email, emp.department || null, emp.role || null, now, now]
        );

        created.push(result.rows[0]);
      } catch (error: any) {
        errors.push({ employee: emp, error: error.message });
      }
    }

    res.status(201).json({
      created: created.length,
      errors: errors.length,
      data: created,
      errors_detail: errors,
    });
  } catch (error) {
    console.error('Error creating employees:', error);
    res.status(500).json({ error: 'Failed to create employees' });
  }
});

/**
 * PUT /api/employees/:id
 * Update an employee
 */
router.put('/:id', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { employee_name, email, department, role } = req.body;

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (employee_name !== undefined) {
      updateFields.push(`employee_name = $${paramIndex}`);
      updateValues.push(employee_name);
      paramIndex++;
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      updateValues.push(email);
      paramIndex++;
    }
    if (department !== undefined) {
      updateFields.push(`department = $${paramIndex}`);
      updateValues.push(department);
      paramIndex++;
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      updateValues.push(role);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;
    updateValues.push(id);

    const result = await query(
      `UPDATE employees 
       SET ${updateFields.join(', ')} 
       WHERE employee_id = $${paramIndex} 
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

/**
 * DELETE /api/employees/:id
 * Delete an employee
 */
router.delete('/:id', requireOperator, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM employees WHERE employee_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;

