import { useContext } from 'react';

import type { SettingsContextValue } from '../SettingsContext';
import { SettingsContext } from '../SettingsContext';

export const useSettingsDispatch = (): SettingsContextValue['dispatch'] => useContext(SettingsContext).dispatch;
