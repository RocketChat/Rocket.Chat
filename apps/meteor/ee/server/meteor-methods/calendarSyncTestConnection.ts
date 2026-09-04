import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import { getConfiguredProvider } from '../lib/calendarSync/factory';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		calendarSyncTestConnection(): { message: TranslationKey; params: string[] };
	}
}

Meteor.methods<ServerMethods>({
	async calendarSyncTestConnection() {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-calendar-sync'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'calendarSyncTestConnection' });
		}

		const provider = getConfiguredProvider();
		if (!provider) {
			throw new Meteor.Error('error-calendar-sync-provider-not-configured', 'The calendar sync provider is not fully configured', {
				method: 'calendarSyncTestConnection',
			});
		}

		// Errors are already sanitized (no tokens/credentials) and carry actionable codes
		const result = await provider.testConnection();
		if (!result.ok) {
			throw new Meteor.Error(`${result.error?.code}: ${result.error?.message}`, undefined, { method: 'calendarSyncTestConnection' });
		}

		return {
			message: 'CalendarSync_Connection_Successful' as TranslationKey,
			params: [],
		};
	},
});
