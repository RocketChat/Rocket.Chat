import { check } from 'meteor/check';

import { Storage } from './storage';

class Apps extends Storage {
	add(name, body) {
		check(name, String);
		check(body, {
			redirectUrl: String,
			errorUrl: String
		});

		this._add(name, body);
	}
}

class Settings extends Storage {
	constructor() {
		super();

		this.apps = new Apps;
	}
	add(settings) {
		check(settings, {
			enabled: Match.Optional(Boolean),
			provider: String,
			key: String,
			secret: String
		});

		this._add(settings.provider, {
			enabled: settings.enabled === true,
			provider: settings.provider,
			key: settings.key,
			secret: settings.secret
		});
	}
}

const settings = new Settings;

export default settings;
