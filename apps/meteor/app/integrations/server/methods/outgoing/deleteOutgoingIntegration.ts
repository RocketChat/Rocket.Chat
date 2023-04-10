import { Meteor } from 'meteor/meteor';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOutgoingIntegration(integrationId: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteOutgoingIntegration(integrationId) {
		let integration;

		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteOutgoingIntegration',
			});
		}

		if (await hasPermissionAsync(this.userId, 'manage-outgoing-integrations')) {
			integration = Integrations.findOneById(integrationId);
		} else if (await hasPermissionAsync(this.userId, 'manage-own-outgoing-integrations')) {
			integration = Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteOutgoingIntegration',
			});
		}

		if (!(await integration)) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'deleteOutgoingIntegration',
			});
		}

		await Integrations.removeById(integrationId);
		await IntegrationHistory.removeByIntegrationId(integrationId);

		return true;
	},
});
