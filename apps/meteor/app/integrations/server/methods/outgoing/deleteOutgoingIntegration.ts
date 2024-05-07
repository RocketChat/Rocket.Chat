import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOutgoingIntegration(integrationId: string): Promise<boolean>;
	}
}

export const deleteOutgoingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	let integration;

	if (!userId) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteOutgoingIntegration',
		});
	}

	if (await hasPermissionAsync(userId, 'manage-outgoing-integrations')) {
		integration = Integrations.findOneById(integrationId);
	} else if (await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')) {
		integration = Integrations.findOne({
			'_id': integrationId,
			'_createdBy._id': userId,
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
};

Meteor.methods<ServerMethods>({
	async deleteOutgoingIntegration(integrationId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteOutgoingIntegration',
			});
		}

		await deleteOutgoingIntegration(integrationId, userId);

		return true;
	},
});
