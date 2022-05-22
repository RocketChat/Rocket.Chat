import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../models/server';
import { settings } from '../../../settings';
import Bridge from '../irc-bridge';

Meteor.methods({
	resetIrcConnection() {
		const ircEnabled = Boolean(settings.get('IRC_Enabled'));
		Settings.upsert(
			{ _id: 'IRC_Bridge_Last_Ping' },
			{
				$set: {
					value: new Date(0),
				},
			},
		);
		Settings.upsert(
			{ _id: 'IRC_Bridge_Reset_Time' },
			{
				$set: {
					value: new Date(),
				},
			},
		);

		if (!ircEnabled) {
			return {
				message: 'Connection_Closed',
				params: [],
			};
		}

		setTimeout(
			Meteor.bindEnvironment(() => {
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
			}),
			300,
		);

		return {
			message: 'Connection_Reset',
			params: [],
		};
	},
});
