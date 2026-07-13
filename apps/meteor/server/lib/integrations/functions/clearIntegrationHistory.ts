import type { IOutgoingIntegration, IIntegration } from '@rocket.chat/core-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../authorization/hasPermission';
import notifications from '../../notifications/core/lib/Notifications';
import { triggerHandler } from '../lib/triggerHandler';

export const clearIntegrationHistoryMethod = async (userId: string, integrationId: string): Promise<void> => {
	let integration: IIntegration | null = null;

	if (await hasPermissionAsync(userId, 'manage-outgoing-integrations')) {
		integration = await Integrations.findOneById<IIntegration>(integrationId);
	} else if (await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')) {
		integration = await Integrations.findOne<IIntegration>({
			'_id': integrationId,
			'_createdBy._id': userId,
		});
	} else {
		throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'clearIntegrationHistory' });
	}

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'clearIntegrationHistory' });
	}

	await IntegrationHistory.removeByIntegrationId(integrationId);

	notifications.streamIntegrationHistory.emit(integrationId, { type: 'removed', id: integrationId });
};

export const replayOutgoingIntegrationMethod = async (
	userId: string,
	{ integrationId, historyId }: { integrationId: string; historyId: string },
): Promise<void> => {
	let integration: IOutgoingIntegration | null = null;

	if (await hasPermissionAsync(userId, 'manage-outgoing-integrations')) {
		integration = await Integrations.findOneById<IOutgoingIntegration>(integrationId);
	} else if (await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')) {
		const found = await Integrations.findOne<IOutgoingIntegration>({
			'_id': integrationId,
			'_createdBy._id': userId,
		});

		if (found && 'event' in found) {
			integration = found;
		}
	}

	if (!integration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'replayOutgoingIntegration' });
	}

	const history = await IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

	if (!history) {
		throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', { method: 'replayOutgoingIntegration' });
	}

	await triggerHandler.replay(integration, history);
};
