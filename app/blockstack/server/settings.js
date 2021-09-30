import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { logger } from './logger';
import { settings, SettingsVersion4 } from '../../settings';

const defaults = {
	enable: false,
	loginStyle: 'redirect',
	generateUsername: false,
	manifestURI: Meteor.absoluteUrl('_blockstack/manifest'),
	redirectURI: Meteor.absoluteUrl('_blockstack/validate'),
	authDescription: 'Rocket.Chat login',
	buttonLabelText: 'Blockstack',
	buttonColor: '#271132',
	buttonLabelColor: '#ffffff',
};

Meteor.startup(() => {
	settings.addGroup('Blockstack', function() {
		this.add('Blockstack_Enable', defaults.enable, {
			type: 'boolean',
			i18nLabel: 'Enable',
		});
		this.add('Blockstack_Auth_Description', defaults.authDescription, {
			type: 'string',
		});
		this.add('Blockstack_ButtonLabelText', defaults.buttonLabelText, {
			type: 'string',
		});
		this.add('Blockstack_Generate_Username', defaults.generateUsername, {
			type: 'boolean',
		});
	});
});

// Helper to return all Blockstack settings
const getSettings = () => Object.assign({}, defaults, {
	enable: SettingsVersion4.get('Blockstack_Enable'),
	authDescription: SettingsVersion4.get('Blockstack_Auth_Description'),
	buttonLabelText: SettingsVersion4.get('Blockstack_ButtonLabelText'),
	generateUsername: SettingsVersion4.get('Blockstack_Generate_Username'),
});


// Add settings to auth provider configs on startup
SettingsVersion4.watchMultiple(['Blockstack_Enable',
	'Blockstack_Auth_Description',
	'Blockstack_ButtonLabelText',
	'Blockstack_Generate_Username'], () => {
	const serviceConfig = getSettings();

	if (!serviceConfig.enable) {
		logger.debug('Blockstack not enabled', serviceConfig);
		return ServiceConfiguration.configurations.remove({
			service: 'blockstack',
		});
	}

	ServiceConfiguration.configurations.upsert({
		service: 'blockstack',
	}, {
		$set: serviceConfig,
	});

	logger.debug('Init Blockstack auth', serviceConfig);
});
