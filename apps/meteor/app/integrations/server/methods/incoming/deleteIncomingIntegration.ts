import { Meteor } from 'meteor/meteor';
import { Integrations } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteIncomingIntegration(integrationId: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteIncomingIntegration(integrationId) {
		let integration;
		const { userId } = this;

		if (userId && (await hasPermissionAsync(userId, 'manage-incoming-integrations'))) {
			integration = Integrations.findOneById(integrationId);
		} else if (userId && (await hasPermissionAsync(userId, 'manage-own-incoming-integrations'))) {
			integration = Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteIncomingIntegration',
			});
		}

		if (!(await integration)) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'deleteIncomingIntegration',
			});
		}

		await Integrations.removeById(integrationId);

		return true;
	},
});
