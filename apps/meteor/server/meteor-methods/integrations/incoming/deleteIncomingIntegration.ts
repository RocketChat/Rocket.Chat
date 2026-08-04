import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../lib/authorization/hasPermission';
import { methodDeprecationLogger } from '../../../lib/deprecationWarningLogger';
import { notifyOnIntegrationChanged } from '../../../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteIncomingIntegration(integrationId: string): Promise<boolean>;
	}
}

export const deleteIncomingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	const canManageAllIntegrations = !!userId && (await hasPermissionAsync(userId, 'manage-incoming-integrations'));
	const canManageOwnIntegrations =
		!canManageAllIntegrations && !!userId && (await hasPermissionAsync(userId, 'manage-own-incoming-integrations'));

	if (!canManageAllIntegrations && !canManageOwnIntegrations) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteIncomingIntegration',
		});
	}

	const integration = await Integrations.removeByIdAndCreatedByIfExists({
		_id: integrationId,
		...(canManageOwnIntegrations && { createdBy: userId }),
	});

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'deleteIncomingIntegration',
		});
	}

	void notifyOnIntegrationChanged(integration, 'removed');
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
