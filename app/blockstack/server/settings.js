import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { logger } from './logger';
import { settings, settingsRegistry } from '../../settings/server';

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
	settingsRegistry.addGroup('Blockstack', function () {
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
const getSettings = () =>
	Object.assign({}, defaults, {
		enable: settings.get('Blockstack_Enable'),
		authDescription: settings.get('Blockstack_Auth_Description'),
		buttonLabelText: settings.get('Blockstack_ButtonLabelText'),
		generateUsername: settings.get('Blockstack_Generate_Username'),
	});

// Add settings to auth provider configs on startup
settings.watchMultiple(
	['Blockstack_Enable', 'Blockstack_Auth_Description', 'Blockstack_ButtonLabelText', 'Blockstack_Generate_Username'],
	() => {
		const serviceConfig = getSettings();

		if (!serviceConfig.enable) {
			logger.debug('Blockstack not enabled', serviceConfig);
			return ServiceConfiguration.configurations.remove({
				service: 'blockstack',
			});
		}

		ServiceConfiguration.configurations.upsert(
			{
				service: 'blockstack',
			},
			{
				$set: serviceConfig,
			},
		);

		logger.debug('Init Blockstack auth', serviceConfig);
	},
);
