import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { ChannelSettings } from '../../channel-settings/client';
import { Rooms } from '../../models';
import { settings } from '../../settings/client';
import { CustomOAuth } from '../../custom-oauth/client';

const config = {
	serverURL: '',
	identityPath: '/oauth/user',
	authorizePath: '/oauth/authorize',
	tokenPath: '/oauth/access-token',
	scope: 'user,tca,private-balances',
	tokenSentVia: 'payload',
	usernameField: 'username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.tokenpass'],
		forOtherUsers: ['services.tokenpass.name'],
	},
	accessTokenParam: 'access_token',
};

const Tokenpass = new CustomOAuth('tokenpass', config);

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (settings.get('API_Tokenpass_URL')) {
			config.serverURL = settings.get('API_Tokenpass_URL');
			Tokenpass.configure(config);
		}
	});
});

Meteor.startup(function() {
	ChannelSettings.addOption({
		group: ['room'],
		id: 'tokenpass',
		template: 'channelSettings__tokenpass',
		validation(data) {
			if (data && data.rid) {
				const room = Rooms.findOne(data.rid, { fields: { tokenpass: 1 } });

				return room && room.tokenpass;
			}

			return false;
		},
	});
});
