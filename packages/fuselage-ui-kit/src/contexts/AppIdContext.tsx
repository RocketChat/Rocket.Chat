import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { UiKitContext } from './UiKitContext';

const AppIdContext = createContext('core');

type AppIdProviderProps = {
  children: ReactNode;
  appId?: string;
};

export const AppIdProvider = ({ children, appId }: AppIdProviderProps) => {
  const parentAppId = useContext(AppIdContext);
  const value = appId || parentAppId || 'core';
  return (
    <AppIdContext.Provider value={value}>{children}</AppIdContext.Provider>
  );
};

export const useAppId = () => {
  const outerAppId = useContext(UiKitContext).appId;
  return useContext(AppIdContext) || outerAppId || 'core';
};
