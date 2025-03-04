import { Meteor } from 'meteor/meteor';

import Bridge from '../../app/irc/server/irc-bridge';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureIRC(settings: ICachedSettings): Promise<void> {
	if (!settings.get('IRC_Enabled')) {
		return;
	}

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
	await Meteor.ircBridge.init();
}
