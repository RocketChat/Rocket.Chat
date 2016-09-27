import bugsnag from 'bugsnag';

RocketChat.bugsnag = bugsnag;

RocketChat.settings.get('Bugsnag_api_key', (key, value) => {
	if (value) {
		bugsnag.register(value);
	}
});

const bindEnvironment = Meteor.bindEnvironment;
Meteor.bindEnvironment = function(func, onException, _this) {
	if (typeof(onException) !== 'function') {
		if (!onException || typeof(onException) === 'string') {
			var description = onException || 'callback of async function';
			onException = function(error) {
				RocketChat.bugsnag.notify(error);
				Meteor._debug(
					'Exception in ' + description + ':',
					error && error.stack || error
				);
			};
		}
	}

	return bindEnvironment(func, onException, _this);
};
