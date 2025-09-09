"use client";

import React, { useState } from "react";
import { Bell, User } from "lucide-react";

interface Notification {
  id: string;
  subject: string;
  description: string;
  isRead: boolean;
  icon?: "user" | "bell";
  redirectUrl?: string;
  time: string;
}

const demoNotifications: Notification[] = [
  {
    id: "1",
    subject: "Payment Received",
    description: "₹5,000 has been credited to your wallet.",
    isRead: false,
    icon: "bell",
    redirectUrl: "/wallet",
    time: "2025-09-06 12:45 PM",
  },
  {
    id: "2",
    subject: "New Message",
    description: "Neha Gupta sent you a message.",
    isRead: true,
    icon: "user",
    redirectUrl: "/messages",
    time: "2025-09-06 11:30 AM",
  },
  {
    id: "3",
    subject: "Profile Update",
    description: "Your profile was updated successfully.",
    isRead: false,
    icon: "user",
    redirectUrl: "/profile",
    time: "2025-09-05 08:15 PM",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border 
              ${
                notif.isRead
                  ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              } 
              shadow-sm hover:shadow-md transition-shadow duration-150`}
          >
            {/* Left: Icon + text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0">
                {notif.icon === "user" ? (
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                ) : (
                  <Bell className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notif.subject}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {notif.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                  {notif.time}
                </p>
              </div>
            </div>

            {/* Right: Action */}
            <div className="flex items-center gap-2 sm:self-start sm:ml-auto">
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded"
                >
                  Mark as Read
                </button>
              )}
              {notif.redirectUrl && (
                <a
                  href={notif.redirectUrl}
                  className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded 
                  hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Go
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}