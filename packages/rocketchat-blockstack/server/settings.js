import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { ServiceConfiguration } from 'meteor/service-configuration';
import { logger } from './logger';

const defaults = {
	enable: true,
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
	RocketChat.settings.addGroup('Blockstack', function() {
		this.add('Blockstack_Enable', defaults.enable, {
			type: 'boolean',
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
	enable: RocketChat.settings.get('Blockstack_Enable'),
	authDescription: RocketChat.settings.get('Blockstack_Auth_Description'),
	buttonLabelText: RocketChat.settings.get('Blockstack_ButtonLabelText'),
	generateUsername: RocketChat.settings.get('Blockstack_Generate_Username'),
});

// Add settings to auth provider configs on startup
Meteor.startup(() => {
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
