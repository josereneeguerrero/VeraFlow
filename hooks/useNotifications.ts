import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { api } from '@/convex/_generated/api';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/lib/notifications';

export function useNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  const savePushToken = useMutation(api.users.savePushToken);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    if (data?.actionUrl) {
      router.push(data.actionUrl as any);
    } else if (data?.workflowId) {
      router.push(`/(tabs)/workflows/${data.workflowId}` as any);
    } else if (data?.recommendationId) {
      router.push(`/(tabs)/recommendations/${data.recommendationId}` as any);
    }
  }, [router]);

  const registerForNotifications = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      setExpoPushToken(token);
      setPermissionStatus('granted');
      
      try {
        await savePushToken({ pushToken: token });
      } catch (error) {
        console.error('Failed to save push token:', error);
      }
    } else {
      setPermissionStatus('denied');
    }
    
    return token;
  }, [savePushToken]);

  useEffect(() => {
    registerForNotifications();

    notificationListener.current = addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [registerForNotifications, handleNotificationResponse]);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    registerForNotifications,
  };
}
