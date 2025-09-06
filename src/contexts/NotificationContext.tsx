import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'reply' | 'helpful_vote';
  title: string;
  message: string;
  postId?: string;
  reviewId?: string;
  forumPostId?: string;
  targetSection: 'forum' | 'reviews' | 'connection' | 'resources';
  read: boolean;
  createdAt: any;
  fromUser?: {
    name: string;
    email: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  navigateToPost: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notificationData);
    });

    return unsubscribe;
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const navigateToPost = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and target section
    const params = new URLSearchParams();
    
    if (notification.forumPostId) {
      params.set('postId', notification.forumPostId);
    } else if (notification.reviewId) {
      params.set('reviewId', notification.reviewId);
    } else if (notification.postId) {
      params.set('postId', notification.postId);
    }

    // Update URL to show the target section and highlight the specific post
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `#${notification.targetSection}`;
    if (params.toString()) {
      currentUrl.search = params.toString();
    }
    
    // Navigate to the URL
    window.location.href = currentUrl.toString();
    
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('navigateToPost', {
      detail: {
        section: notification.targetSection,
        postId: notification.forumPostId || notification.reviewId || notification.postId,
        type: notification.type
      }
    }));
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    navigateToPost
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
