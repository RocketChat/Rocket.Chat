import { appStatusSpanProps } from '../helpers';
import type { App } from '../types';

export const filterAppsByDisabled = (app: App): boolean => {
	const appStatus = appStatusSpanProps(app)?.label;

	const uiDisabledStatus = ['Disabled', 'Disabled*', 'Config Needed', 'Failed'];

	return uiDisabledStatus.includes(appStatus || '');
};
