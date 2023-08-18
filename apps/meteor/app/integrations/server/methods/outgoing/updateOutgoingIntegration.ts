import type { IIntegration, INewOutgoingIntegration, IUpdateOutgoingIntegration } from '@rocket.chat/core-typings';
import { Integrations, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

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

const FREEZE_INTEGRATION_SCRIPTS = ['yes', 'true'].includes(String(process.env.FREEZE_INTEGRATION_SCRIPTS).toLowerCase());

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

		if (FREEZE_INTEGRATION_SCRIPTS && integration.script?.trim() !== currentIntegration.script?.trim()) {
			throw new Meteor.Error('integration-scripts-disabled');
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
					...(FREEZE_INTEGRATION_SCRIPTS
						? {}
						: {
								script: integration.script,
								scriptEnabled: integration.scriptEnabled,
								...(integration.scriptCompiled ? { scriptCompiled: integration.scriptCompiled } : { scriptError: integration.scriptError }),
						  }),
					triggerWords: integration.triggerWords,
					retryFailedCalls: integration.retryFailedCalls,
					retryCount: integration.retryCount,
					retryDelay: integration.retryDelay,
					triggerWordAnywhere: integration.triggerWordAnywhere,
					runOnEdits: integration.runOnEdits,
					_updatedAt: new Date(),
					_updatedBy: await Users.findOne({ _id: this.userId }, { projection: { username: 1 } }),
				},
				...(FREEZE_INTEGRATION_SCRIPTS
					? {}
					: {
							$unset: {
								...(integration.scriptCompiled ? { scriptError: 1 as const } : { scriptCompiled: 1 as const }),
							},
					  }),
			},
		);

		return Integrations.findOneById(integrationId);
	},
});
