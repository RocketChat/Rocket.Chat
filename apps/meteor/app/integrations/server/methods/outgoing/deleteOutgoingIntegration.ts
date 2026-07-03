import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';
import { notifyOnIntegrationChangedById } from '../../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOutgoingIntegration(integrationId: string): Promise<boolean>;
	}
}

export const deleteOutgoingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	if (!userId) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteOutgoingIntegration',
		});
	}

	let canManageAllIntegrations = false;

	if (await hasPermissionAsync(userId, 'manage-outgoing-integrations')) {
		canManageAllIntegrations = true;
	} else if (!(await hasPermissionAsync(userId, 'manage-own-outgoing-integrations'))) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteOutgoingIntegration',
		});
	}

	const integration = await Integrations.removeByIdAndCreatedByIfExists({
		_id: integrationId,
		...(!canManageAllIntegrations && { createdBy: userId }),
	});

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'deleteOutgoingIntegration',
		});
	}

	// Don't sending to IntegrationHistory listener since it don't waits for 'removed' events.
	await IntegrationHistory.removeByIntegrationId(integrationId);
	void notifyOnIntegrationChangedById(integrationId, 'removed');
};

Meteor.methods<ServerMethods>({
	async deleteOutgoingIntegration(integrationId) {
		methodDeprecationLogger.method('deleteOutgoingIntegration', '9.0.0', '/v1/integrations.remove');
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
