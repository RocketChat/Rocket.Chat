import type { App } from '@rocket.chat/core-typings';

import type { appStatusSpanResponseProps } from '../utils/appStatusSpanResponseProps';
import appIncompatibleStatusProps from './appIncompatibleStatusProps';
import { appStatusSpanProps } from './appStatusSpanProps';

const appMultiStatusProps = (app: App, isAppDetailsPage: boolean): appStatusSpanResponseProps[] => {
	const status = appStatusSpanProps(app);
	const statuses = [];

	if (app?.versionIncompatible !== undefined && !isAppDetailsPage) {
		statuses.push(appIncompatibleStatusProps());
	}

	if (status) {
		statuses.push(status);
	}

	return statuses;
};

export default appMultiStatusProps;
