/**
 * In-memory notification store for demo mode
 */

export interface Notification {
  id: string;
  type: "evidence_pending" | "evidence_approved" | "evidence_rejected" | "evidence_expiring" | "integration_sync" | "export_ready" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Initialize with sample notifications
let notifications: Notification[] = [
  {
    id: "notif-1",
    type: "evidence_pending",
    title: "Evidence Pending Review",
    message: "AWS GuardDuty Findings Report needs your approval",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    actionUrl: "/evidence",
  },
  {
    id: "notif-2",
    type: "evidence_expiring",
    title: "Evidence Expiring Soon",
    message: "3 evidence items will expire in the next 30 days",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actionUrl: "/evidence",
  },
  {
    id: "notif-3",
    type: "integration_sync",
    title: "GitHub Sync Complete",
    message: "Successfully collected 2 new evidence items from GitHub",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    actionUrl: "/integrations",
  },
  {
    id: "notif-4",
    type: "export_ready",
    title: "Audit Packet Ready",
    message: "Your SOC2 audit packet is ready for download",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    actionUrl: "/exports",
  },
];

let nextNotifId = 5;

/**
 * Get all notifications
 */
export function getNotifications(): Notification[] {
  return notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string): void {
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
  }
}

/**
 * Mark all as read
 */
export function markAllAsRead(): void {
  notifications.forEach((n) => {
    n.read = true;
  });
}

/**
 * Create a new notification
 */
export function createNotification(
  data: Omit<Notification, "id" | "read" | "createdAt">
): Notification {
  const notification: Notification = {
    id: `notif-${nextNotifId++}`,
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  return notification;
}

/**
 * Delete a notification
 */
export function deleteNotification(id: string): void {
  notifications = notifications.filter((n) => n.id !== id);
}

