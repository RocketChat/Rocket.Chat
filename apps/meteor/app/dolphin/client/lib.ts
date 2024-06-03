import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CustomOAuth } from '../../custom-oauth/client/CustomOAuth';
import { settings } from '../../settings/client';

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

Meteor.startup(() =>
	Tracker.autorun(() => {
		if (settings.get('Accounts_OAuth_Dolphin_URL')) {
			config.serverURL = settings.get('Accounts_OAuth_Dolphin_URL');
			return Dolphin.configure(config);
		}
	}),
);
