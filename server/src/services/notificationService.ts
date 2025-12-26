import { query } from '../config/database';

interface NotificationData {
  notification_type: 'asset_assigned' | 'asset_returned';
  asset_id: string;
  asset_name?: string;
  asset_asset_id?: string;
  assigned_to?: string;
  employee_id?: string;
  employee_name?: string;
  action_by: string;
}

/**
 * Get all Super Admin and Admin users
 */
async function getAdminUsers(): Promise<Array<{ email: string; role: string }>> {
  try {
    const result = await query(
      "SELECT email, role FROM users WHERE role IN ('Super Admin', 'Admin')",
      []
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

/**
 * Create dashboard notifications for all admin users
 */
export async function createNotificationsForAdmins(
  notificationData: NotificationData
): Promise<void> {
  try {
    const adminUsers = await getAdminUsers();

    if (adminUsers.length === 0) {
      console.log('No admin users found to notify');
      return;
    }

    // Create notifications for each admin user
    const notificationPromises = adminUsers.map((admin) =>
      query(
        `INSERT INTO notifications (
          user_email, notification_type, asset_id, asset_name, asset_asset_id,
          assigned_to, employee_id, employee_name, action_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          admin.email,
          notificationData.notification_type,
          notificationData.asset_id,
          notificationData.asset_name || null,
          notificationData.asset_asset_id || null,
          notificationData.assigned_to || null,
          notificationData.employee_id || null,
          notificationData.employee_name || null,
          notificationData.action_by,
        ]
      )
    );

    await Promise.all(notificationPromises);
    console.log(`Created notifications for ${adminUsers.length} admin users`);
  } catch (error) {
    console.error('Error creating notifications for admins:', error);
    // Don't throw - we don't want notification failures to break asset updates
  }
}

/**
 * Create dashboard notifications for admin users when asset assignment/return happens
 */
export async function notifyAdminsAboutAssetChange(
  notificationData: NotificationData
): Promise<void> {
  // Create dashboard notifications only
  await createNotificationsForAdmins(notificationData);
}

