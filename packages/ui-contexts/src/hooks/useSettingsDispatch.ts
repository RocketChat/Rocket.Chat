import { useContext } from 'react';

import type { SettingsContextValue } from '../SettingsContext.js';
import { SettingsContext } from '../SettingsContext.js';

export const useSettingsDispatch = (): SettingsContextValue['dispatch'] => useContext(SettingsContext).dispatch;
