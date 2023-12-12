import type { ReactNode } from 'react';
import { createContext, useContext, useDebugValue } from 'react';

import { UiKitContext } from './UiKitContext';

const AppIdContext = createContext<string | undefined>(undefined);

type AppIdProviderProps = {
  children: ReactNode;
  appId?: string;
};

export const AppIdProvider = ({ children, appId }: AppIdProviderProps) => {
  if (!appId) {
    return <>{children}</>;
  }

  return (
    <AppIdContext.Provider value={appId}>{children}</AppIdContext.Provider>
  );
};

export const useAppId = () => {
  const outerAppId = useContext(UiKitContext).appId ?? 'core';
  const appId = useContext(AppIdContext) ?? outerAppId;

  useDebugValue(appId);

  return appId;
};
