import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useIsPrivilegedSettingsContext = (): boolean => useContext(SettingsContext).hasPrivateAccess;
