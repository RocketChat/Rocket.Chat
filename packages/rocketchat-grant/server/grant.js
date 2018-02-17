import { RocketChat } from 'meteor/rocketchat:lib';

import Providers from './providers';
import Settings from './settings';
import { path, generateCallback, generateAppCallback } from './routes';

function addProviders(config) {
	Settings.forEach((settings, providerName) => {
		if (settings.enabled === true) {
			const registeredProvider = Providers.get(providerName);

			if (!registeredProvider) {
				console.error(`No configuration for '${ providerName }' provider`);
			}

			// basic settings
			const data = {
				key: settings.key,
				secret: settings.secret,
				scope: registeredProvider.scope,
				callback: generateCallback(providerName)
			};

			// set each app
			Settings.apps.forEach((_, appName) => {
				data[appName] = {
					callback: generateAppCallback(providerName, appName)
				};
			});

			config[providerName] = data;
		}
	});
}

const config = {};

export function generateConfig() {
	config['server'] = {
		protocol: 'http',
		host: RocketChat.hostname,
		path,
		state: true
	};

	addProviders(config);

	return config;
}

export function getConfig() {
	return config;
}
