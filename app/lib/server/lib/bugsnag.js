import { Meteor } from 'meteor/meteor';
import Bugsnag from '@bugsnag/js';

import { settings } from '../../../settings/server';
import { Info } from '../../../utils/server';
import { Logger } from '../../../logger/server';

const logger = new Logger('bugsnag');

settings.get('Bugsnag_api_key', (key, value) => {
	if (value) {
		Bugsnag.start({
			apiKey: value,
			appVersion: Info.version,
			logger,
			metadata: Info,
		});
	}
});

const notify = function(message, stack) {
	if (typeof stack === 'string') {
		message += ` ${ stack }`;
	}
	const error = new Error(message);
	error.stack = stack;
	Bugsnag.notify(error);
};

const originalMeteorDebug = Meteor._debug;
Meteor._debug = function _bugsnagDebug(...args) {
	notify(...args);
	return originalMeteorDebug(...args);
};
