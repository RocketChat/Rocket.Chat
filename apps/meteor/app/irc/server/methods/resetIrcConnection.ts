import { Settings } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import Bridge from '../irc-bridge';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		resetIrcConnection(): { message: string; params: unknown[] };
	}
}

Meteor.methods<ServerMethods>({
	async resetIrcConnection() {
		const ircEnabled = Boolean(settings.get('IRC_Enabled'));

		await Settings.updateOne(
			{ _id: 'IRC_Bridge_Last_Ping' },
			{
				$set: {
					value: new Date(0),
				},
			},
			{
				upsert: true,
			},
		);

		await Settings.updateOne(
			{ _id: 'IRC_Bridge_Reset_Time' },
			{
				$set: {
					value: new Date(),
				},
			},
			{
				upsert: true,
			},
		);

		if (!ircEnabled) {
			return {
				message: 'Connection_Closed',
				params: [],
			};
		}

		setTimeout(async () => {
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
			// TODO: is this the best way to do this? is this really necessary?
			Meteor.ircBridge = new Bridge(config);
			await Meteor.ircBridge.init();
		}, 300);

		return {
			message: 'Connection_Reset',
			params: [],
		};
	},
});

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		let ircBridge: Bridge;
	}
}
