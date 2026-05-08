import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage } from '@/lib/offlineStorage';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

interface OfflineStatus {
  isOnline: boolean;
  pendingActionsCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOnline: true,
    pendingActionsCount: 0,
    lastSyncTime: null,
    isSyncing: false,
  });

  const checkPendingActions = useCallback(async () => {
    const stats = await offlineStorage.getCacheStats();
    setOfflineStatus((prev) => ({
      ...prev,
      pendingActionsCount: stats.pendingActionsCount,
      lastSyncTime: stats.lastSyncTime,
    }));
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      setOfflineStatus((prev) => ({
        ...prev,
        isOnline,
      }));

      if (isOnline) {
        checkPendingActions();
      }
    });

    NetInfo.fetch().then((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      setOfflineStatus((prev) => ({
        ...prev,
        isOnline,
      }));
    });

    checkPendingActions();

    return () => {
      unsubscribe();
    };
  }, [checkPendingActions]);

  const refreshStatus = useCallback(async () => {
    const state = await NetInfo.fetch();
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;
    
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });

    setOfflineStatus((prev) => ({
      ...prev,
      isOnline,
    }));

    await checkPendingActions();
  }, [checkPendingActions]);

  return {
    ...networkStatus,
    ...offlineStatus,
    refreshStatus,
  };
}
