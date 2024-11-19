import type { App } from '@rocket.chat/core-typings';

import { appStatusSpanProps } from '../helpers';

export const filterAppsByDisabled = (app: App): boolean => {
	const appStatus = appStatusSpanProps(app)?.label;

	const uiDisabledStatus = ['Disabled', 'Disabled*', 'Config Needed', 'Failed'];

	return uiDisabledStatus.includes(appStatus || '');
};
