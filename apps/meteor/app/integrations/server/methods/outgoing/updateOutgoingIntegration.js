import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { Users } from '../../../../models/server';
import { Integrations } from '../../../../models/server/raw';
import { validateOutgoingIntegration } from '../../lib/validateOutgoingIntegration';

Meteor.methods({
	async updateOutgoingIntegration(integrationId, integration) {
		integration = validateOutgoingIntegration(integration, this.userId);

		if (!integration.token || integration.token.trim() === '') {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', {
				method: 'updateOutgoingIntegration',
			});
		}

		let currentIntegration;

		if (hasPermission(this.userId, 'manage-outgoing-integrations')) {
			currentIntegration = await Integrations.findOneById(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-outgoing-integrations')) {
			currentIntegration = await Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'updateOutgoingIntegration',
			});
		}

		if (!currentIntegration) {
			throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
		}
		if (integration.scriptCompiled) {
			await Integrations.updateOne(
				{ _id: integrationId },
				{
					$set: { scriptCompiled: integration.scriptCompiled },
					$unset: { scriptError: 1 },
				},
			);
		} else {
			await Integrations.updateOne(
				{ _id: integrationId },
				{
					$set: { scriptError: integration.scriptError },
					$unset: { scriptCompiled: 1 },
				},
			);
		}

		await Integrations.updateOne(
			{ _id: integrationId },
			{
				$set: {
					event: integration.event,
					enabled: integration.enabled,
					name: integration.name,
					avatar: integration.avatar,
					emoji: integration.emoji,
					alias: integration.alias,
					channel: integration.channel,
					targetRoom: integration.targetRoom,
					impersonateUser: integration.impersonateUser,
					username: integration.username,
					userId: integration.userId,
					urls: integration.urls,
					token: integration.token,
					script: integration.script,
					scriptEnabled: integration.scriptEnabled,
					triggerWords: integration.triggerWords,
					retryFailedCalls: integration.retryFailedCalls,
					retryCount: integration.retryCount,
					retryDelay: integration.retryDelay,
					triggerWordAnywhere: integration.triggerWordAnywhere,
					runOnEdits: integration.runOnEdits,
					_updatedAt: new Date(),
					_updatedBy: Users.findOne(this.userId, { fields: { username: 1 } }),
				},
			},
		);

		return Integrations.findOneById(integrationId);
	},
});
