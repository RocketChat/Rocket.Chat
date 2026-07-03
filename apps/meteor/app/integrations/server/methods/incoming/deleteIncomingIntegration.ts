import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';
import { notifyOnIntegrationChangedById } from '../../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteIncomingIntegration(integrationId: string): Promise<boolean>;
	}
}

export const deleteIncomingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	let canManageAllIntegrations = false;

	if (userId && (await hasPermissionAsync(userId, 'manage-incoming-integrations'))) {
		canManageAllIntegrations = true;
	} else if (!userId || !(await hasPermissionAsync(userId, 'manage-own-incoming-integrations'))) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteIncomingIntegration',
		});
	}

	const integration = await Integrations.removeByIdAndCreatedByIfExists({
		_id: integrationId,
		...(!canManageAllIntegrations && { createdBy: userId }),
	});

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'deleteIncomingIntegration',
		});
	}

	void notifyOnIntegrationChangedById(integrationId, 'removed');
};

Meteor.methods<ServerMethods>({
	async deleteIncomingIntegration(integrationId) {
		methodDeprecationLogger.method('deleteIncomingIntegration', '9.0.0', '/v1/integrations.remove');
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteIncomingIntegration',
			});
		}

		await deleteIncomingIntegration(integrationId, userId);

		return true;
	},
});
