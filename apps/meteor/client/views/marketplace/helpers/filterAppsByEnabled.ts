import { appStatusSpanProps } from '../helpers';
import type { App } from '../types';

export const filterAppsByEnabled = (app: App): boolean => {
	const appStatus = appStatusSpanProps(app)?.label;

	const uiEnabledStatus = ['Enabled', 'Enabled*', 'Trial period'];

	return uiEnabledStatus.includes(appStatus || '');
};
