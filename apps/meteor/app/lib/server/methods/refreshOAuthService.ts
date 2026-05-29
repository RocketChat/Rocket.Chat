import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { refreshLoginServices } from '../../../../server/lib/refreshLoginServices';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		refreshOAuthService(): Promise<void>;
	}
}

export const refreshOAuthServiceMethod = async (userId: string): Promise<void> => {
	if ((await hasPermissionAsync(userId, 'add-oauth-service')) !== true) {
		throw new Meteor.Error('error-action-not-allowed', 'Refresh OAuth Services is not allowed', {
			method: 'refreshOAuthService',
			action: 'Refreshing_OAuth_Services',
		});
	}

	await refreshLoginServices();
};

Meteor.methods<ServerMethods>({
	async refreshOAuthService() {
		methodDeprecationLogger.method('refreshOAuthService', '9.0.0', '/v1/settings.refreshOAuthServices');

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'refreshOAuthService',
			});
		}

		await refreshOAuthServiceMethod(userId);
	},
});
