import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../settings';
import { CustomOAuth } from '../../custom-oauth';
import { callbacks } from '../../../lib/callbacks';

const config = {
	serverURL: '',
	authorizePath: '/m/oauth2/auth/',
	tokenPath: '/m/oauth2/token/',
	identityPath: '/m/oauth2/api/me/',
	scope: 'basic',
	addAutopublishFields: {
		forLoggedInUser: ['services.dolphin'],
		forOtherUsers: ['services.dolphin.name'],
	},
	accessTokenParam: 'access_token',
};

const Dolphin = new CustomOAuth('dolphin', config);

function DolphinOnCreateUser(options, user) {
	if (user && user.services && user.services.dolphin && user.services.dolphin.NickName) {
		user.username = user.services.dolphin.NickName;
	}
	return options;
}

if (Meteor.isServer) {
	Meteor.startup(() =>
		settings.watch('Accounts_OAuth_Dolphin_URL', (value) => {
			config.serverURL = value;
			return Dolphin.configure(config);
		}),
	);

	if (settings.get('Accounts_OAuth_Dolphin_URL')) {
		const data = {
			buttonLabelText: settings.get('Accounts_OAuth_Dolphin_button_label_text'),
			buttonColor: settings.get('Accounts_OAuth_Dolphin_button_color'),
			buttonLabelColor: settings.get('Accounts_OAuth_Dolphin_button_label_color'),
			clientId: settings.get('Accounts_OAuth_Dolphin_id'),
			secret: settings.get('Accounts_OAuth_Dolphin_secret'),
			serverURL: settings.get('Accounts_OAuth_Dolphin_URL'),
			loginStyle: settings.get('Accounts_OAuth_Dolphin_login_style'),
		};

		ServiceConfiguration.configurations.upsert({ service: 'dolphin' }, { $set: data });
	}

	callbacks.add('beforeCreateUser', DolphinOnCreateUser, callbacks.priority.HIGH, 'dolphin');
} else {
	Meteor.startup(() =>
		Tracker.autorun(function () {
			if (settings.get('Accounts_OAuth_Dolphin_URL')) {
				config.serverURL = settings.get('Accounts_OAuth_Dolphin_URL');
				return Dolphin.configure(config);
			}
		}),
	);
}
