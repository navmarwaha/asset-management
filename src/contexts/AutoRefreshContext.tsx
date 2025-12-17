import React, { createContext, useContext, useState, useCallback } from 'react';

interface AutoRefreshContextType {
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  registerRefreshCallback: (id: string, callback: () => void) => void;
  unregisterRefreshCallback: (id: string) => void;
  triggerRefresh: () => void;
}

const AutoRefreshContext = createContext<AutoRefreshContextType | undefined>(undefined);

export const useAutoRefresh = () => {
  const context = useContext(AutoRefreshContext);
  if (!context) {
    throw new Error('useAutoRefresh must be used within an AutoRefreshProvider');
  }
  return context;
};

export const AutoRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshCallbacks, setRefreshCallbacks] = useState<Map<string, () => void>>(new Map());

  const registerRefreshCallback = useCallback((id: string, callback: () => void) => {
    setRefreshCallbacks(prev => {
      const next = new Map(prev);
      next.set(id, callback);
      return next;
    });
  }, []);

  const unregisterRefreshCallback = useCallback((id: string) => {
    setRefreshCallbacks(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const triggerRefresh = useCallback(() => {
    refreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in refresh callback:', error);
      }
    });
  }, [refreshCallbacks]);

  return (
    <AutoRefreshContext.Provider
      value={{
        autoRefresh,
        setAutoRefresh,
        registerRefreshCallback,
        unregisterRefreshCallback,
        triggerRefresh,
      }}
    >
      {children}
    </AutoRefreshContext.Provider>
  );
};

