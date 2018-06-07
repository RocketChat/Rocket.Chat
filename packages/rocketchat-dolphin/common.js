// Dolphin OAuth2
/* globals CustomOAuth */

const config = {
	serverURL: '',
	authorizePath: '/m/oauth2/auth/',
	tokenPath: '/m/oauth2/token/',
	identityPath: '/m/oauth2/api/me/',
	scope: 'basic',
	addAutopublishFields: {
		forLoggedInUser: ['services.dolphin'],
		forOtherUsers: ['services.dolphin.name']
	}
};

const Dolphin = new CustomOAuth('dolphin', config);

function DolphinOnCreateUser(options, user) {
	if (user && user.services && user.services.dolphin && user.services.dolphin.NickName) {
		user.username = user.services.dolphin.NickName;
	}
	return user;
}

if (Meteor.isServer) {
	Meteor.startup(() =>
		RocketChat.models.Settings.find({ _id: 'Accounts_OAuth_Dolphin_URL' }).observe({
			added() {
				config.serverURL = RocketChat.settings.get('Accounts_OAuth_Dolphin_URL');
				return Dolphin.configure(config);
			},
			changed() {
				config.serverURL = RocketChat.settings.get('Accounts_OAuth_Dolphin_URL');
				return Dolphin.configure(config);
			}
		})
	);

	if (RocketChat.settings.get('Accounts_OAuth_Dolphin_URL')) {
		const data = {
			buttonLabelText: RocketChat.settings.get('Accounts_OAuth_Dolphin_button_label_text'),
			buttonColor: RocketChat.settings.get('Accounts_OAuth_Dolphin_button_color'),
			buttonLabelColor: RocketChat.settings.get('Accounts_OAuth_Dolphin_button_label_color'),
			clientId: RocketChat.settings.get('Accounts_OAuth_Dolphin_id'),
			secret: RocketChat.settings.get('Accounts_OAuth_Dolphin_secret'),
			serverURL: RocketChat.settings.get('Accounts_OAuth_Dolphin_URL'),
			loginStyle: RocketChat.settings.get('Accounts_OAuth_Dolphin_login_style')
		};

		ServiceConfiguration.configurations.upsert({service: 'dolphin'}, {$set: data});
	}

	RocketChat.callbacks.add('beforeCreateUser', DolphinOnCreateUser, RocketChat.callbacks.priority.HIGH);
} else {
	Meteor.startup(() =>
		Tracker.autorun(function() {
			if (RocketChat.settings.get('Accounts_OAuth_Dolphin_URL')) {
				config.serverURL = RocketChat.settings.get('Accounts_OAuth_Dolphin_URL');
				return Dolphin.configure(config);
			}
		})
	);
}
