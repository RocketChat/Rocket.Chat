import type { ISetting } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useSettingsDispatch = (): ((changes: Partial<ISetting>[], onSaved?: () => void) => Promise<void>) =>
	useContext(SettingsContext).dispatch;
