// src/pages/user/NotificationsPage.tsx
import { useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationStore, Notification } from '../../stores/notificationStore';
import { format } from 'date-fns';

export function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string, severity?: string) => {
    if (type === 'ALERT') {
      if (severity === 'HIGH') return <AlertTriangle className="text-red-500" />;
      if (severity === 'MEDIUM') return <AlertTriangle className="text-yellow-500" />;
      return <AlertTriangle className="text-blue-500" />;
    }
    return <Info className="text-blue-500" />;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const loadMore = () => {
    if (pagination.hasNext) {
      fetchNotifications(pagination.currentPage + 1);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <Bell className="mr-2" /> Notifications
            </h1>

            {notifications.length > 0 && (
                <button
                    onClick={() => markAllAsRead()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
              <div className="text-center py-8">Loading notifications...</div>
          ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
          ) : notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications yet</h3>
                <p className="text-gray-500">
                  When you receive notifications about health alerts or important updates, they'll appear here.
                </p>
              </div>
          ) : (
              <>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                      <div
                          key={notification.id}
                          className={`bg-white rounded-lg shadow-sm p-4 transition-all ${
                              !notification.read ? 'border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.alertSeverity)}
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <span className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </span>
                            </div>

                            <p className="text-gray-600 mt-1">{notification.message}</p>

                            {notification.alertDescription && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                                  {notification.alertDescription}
                                </div>
                            )}

                            {!notification.read && (
                                <div className="mt-2 flex justify-end">
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <CheckCircle size={16} className="mr-1" /> Mark as read
                                  </button>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>

                {pagination.hasNext && (
                    <div className="mt-6 text-center">
                      <button
                          onClick={loadMore}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Load more
                      </button>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
}