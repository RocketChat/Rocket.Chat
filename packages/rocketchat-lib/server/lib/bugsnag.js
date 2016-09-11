import bugsnag from 'bugsnag';

RocketChat.bugsnag = bugsnag;

RocketChat.settings.get('Bugsnag_api_key', (key, value) => {
	if (value) {
		bugsnag.register(value);
	}
});
