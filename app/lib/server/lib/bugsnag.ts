import { Meteor } from 'meteor/meteor';
import Bugsnag from '@bugsnag/js';

import { settings } from '../../../settings/server';
import { Info } from '../../../utils/server';
import { Logger } from '../../../logger/server';

const logger = new Logger('bugsnag');

const originalMeteorDebug = Meteor._debug;

function _bugsnagDebug(message: any, stack: any, ...args: any): void {
	if (stack instanceof Error) {
		Bugsnag.notify(stack, (event) => {
			event.context = message;
		});
	} else {
		if (typeof stack === 'string') {
			message += ` ${stack}`;
		}

		const error = new Error(message);
		error.stack = stack;
		Bugsnag.notify(error);
	}

	return originalMeteorDebug(message, stack, ...args);
}

settings.watch('Bugsnag_api_key', (value) => {
	if (!value) {
		return;
	}

	Bugsnag.start({
		apiKey: value as string,
		appVersion: Info.version,
		logger,
		metadata: Info,
	});

	Meteor._debug = _bugsnagDebug;
});
