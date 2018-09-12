/* global CustomOAuth */
import _ from 'underscore';

const config = {
	serverURL: 'https://open.weixin.qq.com',
	tokenPath: 'https://api.weixin.qq.com/sns/oauth2/access_token',
	tokenSentVia: 'payload',
	identityTokenSentVia: 'default',
	identityPath: 'https://api.weixin.qq.com/sns/userinfo',
	scope: 'snsapi_login',
	usernameField: 'nickname',
	mergeUsers: false,
	buttonColor: '#4fc134',
	addAutopublishFields: {
		forLoggedInUser: ['services.wechat'],
		forOtherUsers: ['services.wechat.nickname'],
	},
};

class WeChatOAuth extends CustomOAuth {
	fixThirdPartyIdentityRules(identity) {
		const newIdentity = super.fixThirdPartyIdentityRules(identity);

		// quick & dirty for wechat email
		newIdentity.email = `${ newIdentity.openid }@wechat.app`;

		return newIdentity;
	}
}

const WeChat = new WeChatOAuth('wechat', config);

const fillSettings = _.debounce(Meteor.bindEnvironment(() => {
	config.serverURL = config.serverURL.trim().replace(/\/*$/, '');

	config.clientId = RocketChat.settings.get('Accounts_OAuth_WeChat_appid');
	config.secret = RocketChat.settings.get('Accounts_OAuth_WeChat_appsecret');

	if (RocketChat.settings.get('Accounts_OAuth_WeChat_username_field')) {
		config.usernameField = RocketChat.settings.get('Accounts_OAuth_WeChat_username_field');
	}

	const result = WeChat.configure(config);
	if (Meteor.isServer) {
		const enabled = RocketChat.settings.get('Accounts_OAuth_WeChat');
		if (enabled) {
			ServiceConfiguration.configurations.upsert({
				service: 'wechat',
			}, {
				$set: config,
			});
		} else {
			ServiceConfiguration.configurations.remove({
				service: 'wechat',
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
