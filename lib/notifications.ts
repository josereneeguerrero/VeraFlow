import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;

async function getNotificationsModule(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  return notificationsModule;
}

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export interface PushNotificationState {
  token: string | null;
  notification: Notifications.Notification | null;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (isExpoGo()) {
    console.log('Push notifications are disabled in Expo Go. Use a development build.');
    return null;
  }

  const Notifications = await getNotificationsModule();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B5BDB',
    });

    await Notifications.setNotificationChannelAsync('approvals', {
      name: 'Approvals',
      description: 'Notifications for approval requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    await Notifications.setNotificationChannelAsync('deadlines', {
      name: 'Deadlines',
      description: 'Deadline reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });

    await Notifications.setNotificationChannelAsync('policies', {
      name: 'Policies',
      description: 'Policy acknowledgment reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for push notifications was denied');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) {
      console.log('No project ID found for push notifications');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

export function addNotificationReceivedListener(
  callback: (notification: import('expo-notifications').Notification) => void
): Promise<import('expo-notifications').Subscription> {
  return getNotificationsModule().then((Notifications) =>
    Notifications.addNotificationReceivedListener(callback)
  );
}

export function addNotificationResponseReceivedListener(
  callback: (response: import('expo-notifications').NotificationResponse) => void
): Promise<import('expo-notifications').Subscription> {
  return getNotificationsModule().then((Notifications) =>
    Notifications.addNotificationResponseReceivedListener(callback)
  );
}

export async function removeNotificationSubscription(
  subscription: import('expo-notifications').Subscription
): Promise<void> {
  const Notifications = await getNotificationsModule();
  Notifications.removeNotificationSubscription(subscription);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: import('expo-notifications').NotificationTriggerInput
): Promise<string> {
  const Notifications = await getNotificationsModule();
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null,
  });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  const Notifications = await getNotificationsModule();
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  return await Notifications.setBadgeCountAsync(count);
}

export async function dismissAllNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  await Notifications.dismissAllNotificationsAsync();
}

export type NotificationType = 
  | 'workflow_assigned'
  | 'step_approval_required'
  | 'recommendation_critical'
  | 'due_date_reminder'
  | 'workflow_completed'
  | 'team_member_joined';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    workflowId?: string;
    stepId?: string;
    recommendationId?: string;
    userId?: string;
    actionUrl?: string;
  };
}
