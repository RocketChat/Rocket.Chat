import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import notifications from '../../../notifications/server/lib/Notifications';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		clearIntegrationHistory(integrationId: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async clearIntegrationHistory(integrationId) {
		let integration;

		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'clearIntegrationHistory',
			});
		}

		if (await hasPermissionAsync(this.userId, 'manage-outgoing-integrations')) {
			integration = await Integrations.findOneById(integrationId);
		} else if (await hasPermissionAsync(this.userId, 'manage-own-outgoing-integrations')) {
			integration = await Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'clearIntegrationHistory',
			});
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'clearIntegrationHistory',
			});
		}

		// Don't sending to IntegrationHistory listener since it don't waits for 'removed' events.
		await IntegrationHistory.removeByIntegrationId(integrationId);

		notifications.streamIntegrationHistory.emit(integrationId, { type: 'removed', id: integrationId });

		return true;
	},
});
