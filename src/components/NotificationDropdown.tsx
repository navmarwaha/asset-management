import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { useAutoRefresh } from '@/contexts/AutoRefreshContext';

interface Notification {
  id: string;
  notification_type: 'asset_assigned' | 'asset_returned';
  asset_id: string;
  asset_name: string;
  asset_asset_id: string;
  assigned_to?: string;
  employee_id?: string;
  employee_name?: string;
  action_by: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { autoRefresh, triggerRefresh } = useAutoRefresh();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notificationsResponse, countResponse] = await Promise.all([
        api.notifications.getAll({ limit: 20 }),
        api.notifications.getUnreadCount(),
      ]);
      setNotifications(notificationsResponse.data);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Register refresh callback
  useEffect(() => {
    const refreshNotifications = () => {
      fetchNotifications();
    };
    
    // Register with AutoRefreshContext if available
    if (triggerRefresh) {
      // We'll need to register this callback
      // For now, we'll use a polling approach when auto-refresh is enabled
    }
  }, [triggerRefresh]);

  // Auto-refresh notifications when auto-refresh is enabled
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationMessage = (notification: Notification): string => {
    const assetInfo = `${notification.asset_name} (${notification.asset_asset_id})`;
    const employeeInfo = notification.employee_name
      ? `${notification.employee_name} (${notification.employee_id})`
      : notification.assigned_to || 'Unknown';

    if (notification.notification_type === 'asset_assigned') {
      return `Asset ${assetInfo} assigned to ${employeeInfo}`;
    } else {
      return `Asset ${assetInfo} returned from ${employeeInfo}`;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {notification.action_by}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {readNotifications.length > 0 && <DropdownMenuSeparator />}
                </>
              )}
              {readNotifications.length > 0 && (
                <>
                  {readNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer opacity-60"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {notification.action_by}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Check className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

