/* global CustomOAuth */
const config = {
	serverURL: '',
	identityPath: '/',
	scope: '',
	addAutopublishFields: {
	}
};

const WeChat = new CustomOAuth('wechat', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('Accounts_OAuth_WeChat_URL', function(key, value) {
			config.serverURL = value.trim().replace(/\/*$/, '');
			WeChat.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('Accounts_OAuth_WeChat_URL')) {
				config.serverURL = RocketChat.settings.get('Accounts_OAuth_WeChat_URL').trim().replace(/\/*$/, '');
				WeChat.configure(config);
			}
		});
	});
}
