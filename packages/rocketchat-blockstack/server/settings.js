const logger = new Logger('Blockstack');

// Rocket.Chat Blockstack provider config defaults, settings can override
Accounts.blockstack.defaults = {
	enable: true,
	blockstackIDHost: Accounts.blockstack.authHost,
	loginStyle: 'redirect',
	generateUsername: true,
	manifestURI: Meteor.absoluteUrl(Accounts.blockstack.manifestPath),
	redirectURI: Meteor.absoluteUrl(Accounts.blockstack.redirectPath),
	authDescription: 'Rocket.Chat login'
};

// Add required settings (not all used in current version)
Meteor.startup(() => {
	const defaults = Accounts.blockstack.defaults;
	RocketChat.settings.addGroup('Blockstack');
	RocketChat.settings.add('Blockstack_Enable', defaults.enable, {
		type: 'boolean',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Enable'
	});
	RocketChat.settings.add('Blockstack_Login_style', defaults.loginStyle, {
		type: 'select',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Login_Style',
		values: [
			{ key: 'redirect', i18nLabel: 'Redirect' },
			{ key: 'popup', i18nLabel: 'Popup' }
		]
	});
	RocketChat.settings.add('Blockstack_Auth_Description', defaults.authDescription, {
		type: 'string',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Auth_Description'
	});
	RocketChat.settings.add('Blockstack_Generate_Username', defaults.generateUsername, {
		type: 'boolean',
		group: 'Blockstack',
		i18nLabel: 'Blockstack_Generate_Username'
	});
});

// Helper to return all Blockstack settings
Accounts.blockstack.getSettings = () => {
	return Object.assign({}, Accounts.blockstack.defaults, {
		enable: RocketChat.settings.get('Blockstack_Enable'),
		generateUsername: RocketChat.settings.get('Blockstack_Generate_Username'),
		loginStyle: RocketChat.settings.get('Blockstack_Login_Style')
	});
};

// Add settings to auth provider configs
const serviceConfig = Accounts.blockstack.getSettings();
if (serviceConfig.enable) {
	ServiceConfiguration.configurations.upsert({
		service: 'blockstack'
	}, {
		$set: Accounts.blockstack.getSettings()
	});
	logger.debug('Init Blockstack auth', serviceConfig);
} else {
	logger.debug('Blockstack not enabled', serviceConfig);
	ServiceConfiguration.configurations.remove({
		service: 'blockstack'
	});
}
