import type { App } from '@rocket.chat/core-typings';

import { appStatusSpanProps } from '../helpers';

export const filterAppsByEnabled = (app: App): boolean => {
	const appStatus = appStatusSpanProps(app)?.label;

	const uiEnabledStatus = ['Enabled', 'Enabled*', 'Trial period'];

	return uiEnabledStatus.includes(appStatus || '');
};
