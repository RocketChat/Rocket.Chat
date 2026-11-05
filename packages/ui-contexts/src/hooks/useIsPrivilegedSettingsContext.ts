import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext.js';

export const useIsPrivilegedSettingsContext = (): boolean => useContext(SettingsContext).hasPrivateAccess;
