import { useTranslation } from 'react-i18next';

import { useAppId } from '../contexts/AppIdContext';

export const useAppTranslation = () => {
  const appId = useAppId();
  return useTranslation(`app-${appId}`);
};
