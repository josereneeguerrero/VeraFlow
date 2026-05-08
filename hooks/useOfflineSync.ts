import { useEffect, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineStorage, PendingAction } from '@/lib/offlineStorage';

export function useOfflineSync() {
  const { isOnline, pendingActionsCount, refreshPendingCount } = useNetworkStatus();
  const isSyncing = useRef(false);
  
  const completeStep = useMutation(api.workflows.completeStep);
  
  const processPendingActions = useCallback(async () => {
    if (isSyncing.current || !isOnline) return;
    
    isSyncing.current = true;
    
    try {
      const pendingActions = await offlineStorage.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await processAction(action);
          await offlineStorage.removePendingAction(action.id);
        } catch (error) {
          console.error(`Failed to process action ${action.id}:`, error);
          
          if (action.retryCount >= 3) {
            console.error(`Max retries reached for action ${action.id}, removing`);
            await offlineStorage.removePendingAction(action.id);
          } else {
            await offlineStorage.incrementRetryCount(action.id);
          }
        }
      }
      
      await offlineStorage.setLastSyncTime(Date.now());
      refreshPendingCount();
    } finally {
      isSyncing.current = false;
    }
  }, [isOnline, completeStep, refreshPendingCount]);
  
  const processAction = async (action: PendingAction) => {
    switch (action.type) {
      case 'complete_step':
        await completeStep({
          workflowId: action.payload.workflowId,
          stepIndex: action.payload.stepIndex,
        });
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  };
  
  useEffect(() => {
    if (isOnline && pendingActionsCount > 0) {
      processPendingActions();
    }
  }, [isOnline, pendingActionsCount, processPendingActions]);

  const queueAction = useCallback(async (
    type: PendingAction['type'],
    payload: Record<string, any>
  ) => {
    const actionId = await offlineStorage.addPendingAction({ type, payload });
    refreshPendingCount();
    return actionId;
  }, [refreshPendingCount]);

  const syncNow = useCallback(async () => {
    if (isOnline) {
      await processPendingActions();
    }
  }, [isOnline, processPendingActions]);

  return {
    isOnline,
    pendingActionsCount,
    queueAction,
    syncNow,
    isSyncing: isSyncing.current,
  };
}
