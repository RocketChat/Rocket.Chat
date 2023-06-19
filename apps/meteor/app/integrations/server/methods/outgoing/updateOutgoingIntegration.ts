import { Meteor } from 'meteor/meteor';
import { Integrations, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IIntegration, INewOutgoingIntegration, IUpdateOutgoingIntegration } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { validateOutgoingIntegration } from '../../lib/validateOutgoingIntegration';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateOutgoingIntegration(
			integrationId: string,
			integration: INewOutgoingIntegration | IUpdateOutgoingIntegration,
		): IIntegration | null;
	}
}

Meteor.methods<ServerMethods>({
	async updateOutgoingIntegration(integrationId, _integration) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'updateOutgoingIntegration',
			});
		}

		const integration = await validateOutgoingIntegration(_integration, this.userId);

		if (!integration.token || integration.token.trim() === '') {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', {
				method: 'updateOutgoingIntegration',
			});
		}

		let currentIntegration: IIntegration | null;

		if (await hasPermissionAsync(this.userId, 'manage-outgoing-integrations')) {
			currentIntegration = await Integrations.findOneById(integrationId);
		} else if (await hasPermissionAsync(this.userId, 'manage-own-outgoing-integrations')) {
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
					channel: typeof integration.channel === 'string' ? [integration.channel] : integration.channel,
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
					_updatedBy: await Users.findOne({ _id: this.userId }, { projection: { username: 1 } }),
				},
			},
		);

		return Integrations.findOneById(integrationId);
	},
});
