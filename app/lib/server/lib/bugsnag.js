import { Meteor } from 'meteor/meteor';
import bugsnag from 'bugsnag';

import { settings } from '../../../settings';
import { Info } from '../../../utils';

settings.get('Bugsnag_api_key', (key, value) => {
	if (value) {
		bugsnag.register(value);
	}
});

const notify = function(message, stack) {
	if (typeof stack === 'string') {
		message += ` ${ stack }`;
	}
	let options = {};
	if (Info) {
		options = { app: { version: Info.version, info: Info } };
	}
	const error = new Error(message);
	error.stack = stack;
	bugsnag.notify(error, options);
};

process.on('uncaughtException', Meteor.bindEnvironment((error) => {
	notify(error.message, error.stack);
	throw error;
}));

const originalMeteorDebug = Meteor._debug;
Meteor._debug = function(...args) {
	notify(...args);
	return originalMeteorDebug(...args);
};
