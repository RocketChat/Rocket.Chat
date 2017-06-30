import bugsnag from 'bugsnag';

RocketChat.bugsnag = bugsnag;

RocketChat.settings.get('Bugsnag_api_key', (key, value) => {
	if (value) {
		bugsnag.register(value);
	}
});

const notify = function(message, stack) {
	if (typeof stack === 'string') {
		message += ` ${ stack }`;
	}
	let options = {};
	if (RocketChat.Info) {
		options = { app: { version: RocketChat.Info.version, info: RocketChat.Info } };
	}
	const error = new Error(message);
	error.stack = stack;
	RocketChat.bugsnag.notify(error, options);
};

process.on('uncaughtException', Meteor.bindEnvironment((error) => {
	notify(error.message, error.stack);
	throw error;
}));

const originalMeteorDebug = Meteor._debug;
Meteor._debug = function() {
	notify(...arguments);
	return originalMeteorDebug(...arguments);
};
