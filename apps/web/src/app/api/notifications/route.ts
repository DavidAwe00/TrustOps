import { NextResponse } from "next/server";
import { getNotifications, getUnreadCount, markAllAsRead } from "@/lib/notifications-store";

/**
 * GET /api/notifications - Get all notifications
 */
export async function GET() {
  const notifications = getNotifications();
  const unreadCount = getUnreadCount();

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

/**
 * POST /api/notifications - Mark all as read
 */
export async function POST() {
  markAllAsRead();
  return NextResponse.json({ success: true });
}

