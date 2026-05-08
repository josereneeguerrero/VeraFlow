import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  WORKFLOWS: '@veraflow_cache_workflows',
  RECOMMENDATIONS: '@veraflow_cache_recommendations',
  WORKSPACE: '@veraflow_cache_workspace',
  USER_PROFILE: '@veraflow_cache_user',
  PENDING_ACTIONS: '@veraflow_pending_actions',
  LAST_SYNC: '@veraflow_last_sync',
} as const;

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingAction {
  id: string;
  type: 'complete_step' | 'add_note' | 'mark_viewed' | 'dismiss';
  payload: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

export const offlineStorage = {
  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async cacheWorkflows(workflows: any[]): Promise<void> {
    await this.set(CACHE_KEYS.WORKFLOWS, workflows);
  },

  async getCachedWorkflows(): Promise<any[] | null> {
    return this.get(CACHE_KEYS.WORKFLOWS);
  },

  async cacheRecommendations(recommendations: any[]): Promise<void> {
    await this.set(CACHE_KEYS.RECOMMENDATIONS, recommendations);
  },

  async getCachedRecommendations(): Promise<any[] | null> {
    return this.get(CACHE_KEYS.RECOMMENDATIONS);
  },

  async cacheWorkspace(workspace: any): Promise<void> {
    await this.set(CACHE_KEYS.WORKSPACE, workspace);
  },

  async getCachedWorkspace(): Promise<any | null> {
    return this.get(CACHE_KEYS.WORKSPACE);
  },

  async cacheUserProfile(profile: any): Promise<void> {
    await this.set(CACHE_KEYS.USER_PROFILE, profile);
  },

  async getCachedUserProfile(): Promise<any | null> {
    return this.get(CACHE_KEYS.USER_PROFILE);
  },

  async addPendingAction(action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const pendingActions = await this.getPendingActions();
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAction: PendingAction = {
      ...action,
      id,
      createdAt: Date.now(),
      retryCount: 0,
    };

    pendingActions.push(newAction);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(pendingActions));
    
    return id;
  },

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const item = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  async removePendingAction(id: string): Promise<void> {
    const pendingActions = await this.getPendingActions();
    const filtered = pendingActions.filter((a) => a.id !== id);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
  },

  async incrementRetryCount(id: string): Promise<void> {
    const pendingActions = await this.getPendingActions();
    const updated = pendingActions.map((a) =>
      a.id === id ? { ...a, retryCount: a.retryCount + 1 } : a
    );
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  },

  async setLastSyncTime(): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  },

  async getLastSyncTime(): Promise<number | null> {
    const time = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return time ? parseInt(time, 10) : null;
  },

  async clearAllCache(): Promise<void> {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  },

  async getCacheStats(): Promise<{
    workflowsCached: boolean;
    recommendationsCached: boolean;
    pendingActionsCount: number;
    lastSyncTime: number | null;
  }> {
    const [workflows, recommendations, pendingActions, lastSync] = await Promise.all([
      this.getCachedWorkflows(),
      this.getCachedRecommendations(),
      this.getPendingActions(),
      this.getLastSyncTime(),
    ]);

    return {
      workflowsCached: workflows !== null,
      recommendationsCached: recommendations !== null,
      pendingActionsCount: pendingActions.length,
      lastSyncTime: lastSync,
    };
  },
};
