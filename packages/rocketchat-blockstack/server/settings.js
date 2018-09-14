import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Logger } from 'meteor/rocketchat:logger';

import { ServiceConfiguration } from 'meteor/service-configuration';
const logger = new Logger('Blockstack');

// Rocket.Chat Blockstack provider config defaults, settings can override
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

// Add required settings (not all used in current version)
Meteor.startup(() => {
	RocketChat.settings.addGroup('Blockstack');
	RocketChat.settings.add('Blockstack_Enable', defaults.enable, {
		type: 'boolean',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Enable',
	});
	// RocketChat.settings.add('Blockstack_Login_style', defaults.loginStyle, {
	// 	type: 'select',
	// 	group: 'Blockstack',
	// 	i18nLabel: 'Blockstack_Login_Style',
	// 	values: [
	// 		{ key: 'redirect', i18nLabel: 'Redirect' },
	// 		{ key: 'popup', i18nLabel: 'Popup' }
	// 	]
	// });
	RocketChat.settings.add('Blockstack_Auth_Description', defaults.authDescription, {
		type: 'string',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Auth_Description',
	});
	RocketChat.settings.add('Blockstack_ButtonLabelText', defaults.buttonLabelText, {
		type: 'string',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_ButtonLabelText',
	});
	RocketChat.settings.add('Blockstack_Generate_Username', defaults.generateUsername, {
		type: 'boolean',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Generate_Username',
	});
});

// Helper to return all Blockstack settings
const getSettings = () => Object.assign({}, defaults, {
	enable: RocketChat.settings.get('Blockstack_Enable'),
	generateUsername: RocketChat.settings.get('Blockstack_Generate_Username'),
	loginStyle: RocketChat.settings.get('Blockstack_Login_Style'),
	buttonLabelText: RocketChat.settings.get('Blockstack_ButtonLabelText'),
});

// Add settings to auth provider configs on startup
Meteor.startup(() => {
	const serviceConfig = getSettings();
	if (serviceConfig.enable) {
		ServiceConfiguration.configurations.upsert({
			service: 'blockstack',
		}, {
			$set: getSettings(),
		});
		logger.debug('Init Blockstack auth', serviceConfig);
	} else {
		logger.debug('Blockstack not enabled', serviceConfig);
		ServiceConfiguration.configurations.remove({
			service: 'blockstack',
		});
	}
});
