import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../settings';
import { logger } from './lib/Utils';
import { getSamlConfigs, configureSamlService } from './lib/settings';
import { Rooms, CredentialTokens } from '../../models/server';
import { createRoom } from '../../lib/server/functions';

settings.addGroup('SAML');

if (!Accounts.saml) {
	// Those settings are not split by provider !!
	Accounts.saml = {
		settings: {
			debug: false,
			generateUsername: false,
			nameOverwrite: false,
			mailOverwrite: false,
			providers: [],
			// immutableProperty
		},
	};
}

Accounts.normalizeUsername = function(name: string): string {
	switch (Accounts.saml.settings.usernameNormalize) {
		case 'Lowercase':
			name = name.toLowerCase();
			break;
	}

	return name;
};

Accounts.saml.subscribeToSAMLChannels = function(channels: Array, user: object): void {
	try {
		for (let roomName of channels) {
			roomName = roomName.trim();
			if (!roomName) {
				continue;
			}

			const room = Rooms.findOneByNameAndType(roomName, 'c');
			if (!room) {
				createRoom('c', roomName, user.username);
			}
		}
	} catch (err) {
		console.error(err);
	}
};

Accounts.saml.hasCredential = function(credentialToken: string): object {
	return CredentialTokens.findOneById(credentialToken) != null;
};

Accounts.saml.retrieveCredential = function(credentialToken: string): object {
	// The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
	const data = CredentialTokens.findOneById(credentialToken);
	if (data) {
		return data.userInfo;
	}
};

Accounts.saml.storeCredential = function(credentialToken: string, loginResult: object): void {
	CredentialTokens.create(credentialToken, loginResult);
};

const debounce = (fn, delay): () => number => {
	let timer = null;
	return (): number => {
		if (timer != null) {
			Meteor.clearTimeout(timer);
		}
		timer = Meteor.setTimeout(fn, delay);
		return timer;
	};
};
const serviceName = 'saml';

const updateServices = debounce(() => {
	const services = settings.get(/^(SAML_Custom_)[a-z]+$/i);
	Accounts.saml.settings.providers = services.map((service) => {
		if (service.value === true) {
			const samlConfigs = getSamlConfigs(service);
			logger.updated(service.key);
			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase(),
			}, {
				$set: samlConfigs,
			});
			return configureSamlService(samlConfigs);
		}
		return ServiceConfiguration.configurations.remove({
			service: serviceName.toLowerCase(),
		});
	}).filter((e) => e);
}, 2000);


settings.get(/^SAML_.+/, updateServices);

Meteor.startup(() => Meteor.call('addSamlService', 'Default'));
