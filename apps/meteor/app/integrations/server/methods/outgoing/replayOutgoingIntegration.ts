import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { triggerHandler } from '../../lib/triggerHandler';
import { IOutgoingIntegration } from '@rocket.chat/core-typings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		replayOutgoingIntegration(params: { integrationId: string; historyId: string }): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async replayOutgoingIntegration({ integrationId, historyId }) {
		let integration: IOutgoingIntegration | null = null;

		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'replayOutgoingIntegration',
			});
		}

		if (await hasPermissionAsync(this.userId, 'manage-outgoing-integrations')) {
			integration = await Integrations.findOneById<IOutgoingIntegration>(integrationId);
		} else if (await hasPermissionAsync(this.userId, 'manage-own-outgoing-integrations')) {
			const foundIntegration = await Integrations.findOne<IOutgoingIntegration>({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});

			if (foundIntegration && 'event' in foundIntegration) {
				integration = foundIntegration;
			}
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'replayOutgoingIntegration',
			});
		}

		const history = await IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

		if (!history) {
			throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', {
				method: 'replayOutgoingIntegration',
			});
		}

		await triggerHandler.replay(integration, history);

		return true;
	},
});
