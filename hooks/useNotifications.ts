import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { api } from '@/convex/_generated/api';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
} from '@/lib/notifications';

type Notification = import('expo-notifications').Notification;
type NotificationResponse = import('expo-notifications').NotificationResponse;
type Subscription = import('expo-notifications').Subscription;

export function useNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isExpoGo] = useState(Constants.appOwnership === 'expo');

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);
  
  const savePushToken = useMutation(api.users.savePushToken);

  const handleNotificationResponse = useCallback((response: NotificationResponse) => {
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
    if (isExpoGo) {
      setPermissionStatus('denied');
      return null;
    }

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
  }, [isExpoGo, savePushToken]);

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    registerForNotifications();

    let isMounted = true;

    addNotificationReceivedListener((notification) => {
      if (isMounted) {
        setNotification(notification);
      }
    }).then((subscription) => {
      if (isMounted) {
        notificationListener.current = subscription;
      }
    });

    addNotificationResponseReceivedListener(handleNotificationResponse).then((subscription) => {
      if (isMounted) {
        responseListener.current = subscription;
      }
    });

    return () => {
      isMounted = false;

      if (notificationListener.current) {
        removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isExpoGo, registerForNotifications, handleNotificationResponse]);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    registerForNotifications,
  };
}
