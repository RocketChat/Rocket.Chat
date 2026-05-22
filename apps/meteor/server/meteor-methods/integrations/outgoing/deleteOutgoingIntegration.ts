import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../lib/authorization/hasPermission';
import { notifyOnIntegrationChanged } from '../../../lib/notifyListener';

export const deleteOutgoingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	if (!userId) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteOutgoingIntegration',
		});
	}

	const canManageAllIntegrations = await hasPermissionAsync(userId, 'manage-outgoing-integrations');
	const canManageOwnIntegrations = !canManageAllIntegrations && (await hasPermissionAsync(userId, 'manage-own-outgoing-integrations'));

	if (!canManageAllIntegrations && !canManageOwnIntegrations) {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteOutgoingIntegration',
		});
	}

	const integration = await Integrations.removeByIdAndCreatedByIfExists({
		_id: integrationId,
		...(canManageOwnIntegrations && { createdBy: userId }),
	});

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'deleteOutgoingIntegration',
		});
	}

	// Don't sending to IntegrationHistory listener since it don't waits for 'removed' events.
	await IntegrationHistory.removeByIntegrationId(integrationId);
	void notifyOnIntegrationChanged(integration, 'removed');
};
