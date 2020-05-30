import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings';
import { t } from '../../../app/utils';
import Bridge from '../irc-bridge';

Meteor.methods({
	resetIrcConnection() {
		const ircEnabled = !!settings.get('IRC_Enabled') === true;

		if (Meteor.ircBridge) {
			Meteor.ircBridge.stop();
			if (!ircEnabled) {
				return {
					message: 'Connection_Closed',
					params: [],
				};
			}
		}

		if (ircEnabled) {
			if (Meteor.ircBridge) {
				Meteor.ircBridge.init();
				return {
					message: 'Connection_Reset',
					params: [],
				};
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
			Meteor.ircBridge.init();

			return {
				message: 'Connection_Reset',
				params: [],
			};
		}

		throw new Meteor.Error(t('IRC_Federation_Disabled'));
	},
});
