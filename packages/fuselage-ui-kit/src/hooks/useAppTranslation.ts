import { useDebugValue } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppId } from '../contexts/AppIdContext';

export const useAppTranslation = () => {
  const appId = useAppId();
  const appNs = `app-${appId}`;

  useDebugValue(appNs);

  return useTranslation(appNs);
};
