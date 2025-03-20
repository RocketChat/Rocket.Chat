import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useIsSettingsContextLoading = (): boolean => useContext(SettingsContext).isLoading;
