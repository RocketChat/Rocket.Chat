import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import Bridge from '../irc-bridge';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		resetIrcConnection(): { message: string; params: unknown[] };
	}
}

Meteor.methods<ServerMethods>({
	async resetIrcConnection() {
		const ircEnabled = Boolean(settings.get('IRC_Enabled'));
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'resetIrcConnection' });
		}

		if (!(await hasPermissionAsync(uid, 'edit-privileged-setting'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'resetIrcConnection' });
		}

		const auditSettingOperation = updateAuditedByUser({
			_id: uid,
			username: (await Meteor.userAsync())!.username!,
			ip: this.connection?.clientAddress || '',
			useragent: this.connection?.httpHeaders['user-agent'] || '',
		});

		const updatedLastPingValue = await auditSettingOperation(Settings.updateValueById, 'IRC_Bridge_Last_Ping', new Date(0), {
			upsert: true,
		});
		if (updatedLastPingValue.modifiedCount || updatedLastPingValue.upsertedCount) {
			void notifyOnSettingChangedById('IRC_Bridge_Last_Ping');
		}

		const updatedResetTimeValue = await auditSettingOperation(Settings.updateValueById, 'IRC_Bridge_Reset_Time', new Date(), {
			upsert: true,
		});
		if (updatedResetTimeValue.modifiedCount || updatedResetTimeValue.upsertedCount) {
			void notifyOnSettingChangedById('IRC_Bridge_Last_Ping');
		}

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
