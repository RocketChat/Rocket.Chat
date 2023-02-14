import { useContext } from 'react';
import type { ISetting } from '@rocket.chat/core-typings';

import { SettingsContext } from '../SettingsContext';

export const useSettingsDispatch = (): ((changes: Partial<ISetting>[]) => Promise<void>) => useContext(SettingsContext).dispatch;
