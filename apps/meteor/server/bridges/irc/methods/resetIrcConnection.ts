import { ClientSafeError } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../lib/authorization/hasPermission';
import { notifyOnSettingChangedById } from '../../../lib/notifyListener';
import { settings } from '../../../settings';
import { updateAuditedByUser } from '../../../settings/lib/auditedSettingUpdates';
import { startIrcBridge } from '../startIrcBridge';

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
			throw new ClientSafeError('error-invalid-user', 'Invalid user', { method: 'resetIrcConnection' });
		}

		if (!(await hasPermissionAsync(uid, 'edit-privileged-setting'))) {
			throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'resetIrcConnection' });
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

		setTimeout(() => void startIrcBridge(), 300);

		return {
			message: 'Connection_Reset',
			params: [],
		};
	},
});
