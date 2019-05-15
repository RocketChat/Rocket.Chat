import { Meteor } from 'meteor/meteor';

import Bridge from './irc-bridge';
import { settings } from '../../settings';

if (!!settings.get('IRC_Enabled') === true) {
	// Normalize the config values
	const config = {
		server: {
			protocol: settings.get('IRC_Protocol'),
			host: settings.get('IRC_Host'),
			port: settings.get('IRC_Port'),
			name: settings.get('IRC_Name'),
			description: settings.get('IRC_Description'),
		},
		passwords: {
			local: settings.get('IRC_Local_Password'),
			peer: settings.get('IRC_Peer_Password'),
		},
	};

	Meteor.ircBridge = new Bridge(config);

	Meteor.startup(() => {
		Meteor.ircBridge.init();
	});
}
