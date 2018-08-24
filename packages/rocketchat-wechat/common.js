/* global CustomOAuth */
import _ from 'underscore';

const config = {
	serverURL: '',
	identityPath: '/',
	scope: '',
	buttonColor: '#4fc134',
	addAutopublishFields: {
		forLoggedInUser: ['services.wechat'],
		forOtherUsers: ['services.wechat.nickname']
	}
};

const WeChat = new CustomOAuth('wechat', config);

const fillSettings = _.debounce(Meteor.bindEnvironment(() => {
	config.serverURL = RocketChat.settings.get('Accounts_OAuth_WeChat_URL').trim().replace(/\/*$/, '');

	delete config.identityPath;
	delete config.identityTokenSentVia;
	delete config.tokenPath;
	delete config.tokenSentVia;
	delete config.authorizePath;
	delete config.scope;
	delete config.usernameField;
	delete config.mergeUsers;

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_identity_path')) {
		config.identityPath = RocketChat.settings.get('Accounts_OAuth_WeChat_identity_path');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_identity_token_sent_via')) {
		config.identityTokenSentVia = RocketChat.settings.get('Accounts_OAuth_WeChat_identity_token_sent_via');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_token_path')) {
		config.tokenPath = RocketChat.settings.get('Accounts_OAuth_WeChat_token_path');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_authorize_path')) {
		config.authorizePath = RocketChat.settings.get('Accounts_OAuth_WeChat_authorize_path');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_scope')) {
		config.scope = RocketChat.settings.get('Accounts_OAuth_WeChat_scope');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_token_sent_via')) {
		config.tokenSentVia = RocketChat.settings.get('Accounts_OAuth_WeChat_token_sent_via');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_username_field')) {
		config.usernameField = RocketChat.settings.get('Accounts_OAuth_WeChat_username_field');
	}

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_merge_users')) {
		config.mergeUsers = RocketChat.settings.get('Accounts_OAuth_WeChat_merge_users');
	}

	const result = WeChat.configure(config);
	if (Meteor.isServer) {
		const enabled = RocketChat.settings.get('Accounts_OAuth_WeChat');
		if (enabled) {
			ServiceConfiguration.configurations.upsert({
				service: 'wechat'
			}, {
				$set: config
			});
		} else {
			ServiceConfiguration.configurations.remove({
				service: 'wechat'
			});
		}
	}

	return result;

}), Meteor.isServer ? 1000 : 100);

if (Meteor.isServer) {
	Meteor.startup(function() {
		return RocketChat.settings.get(/Accounts\_OAuth\_WeChat\_?/, () => fillSettings());
	});
} else {
	Meteor.startup(function() {
		return Tracker.autorun(function() {
			return fillSettings();
		});
	});
}
