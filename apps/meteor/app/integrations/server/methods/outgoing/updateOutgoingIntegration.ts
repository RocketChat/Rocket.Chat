import type { IIntegration, INewOutgoingIntegration, IUpdateOutgoingIntegration } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations, Users } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { notifyOnIntegrationChanged } from '../../../../lib/server/lib/notifyListener';
import { validateOutgoingIntegration } from '../../lib/validateOutgoingIntegration';
import { isScriptEngineFrozen, validateScriptEngine } from '../../lib/validateScriptEngine';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateOutgoingIntegration(
			integrationId: string,
			integration: INewOutgoingIntegration | IUpdateOutgoingIntegration,
		): IIntegration | null;
	}
}

export const updateOutgoingIntegration = async (
	userId: string,
	integrationId: string,
	_integration: INewOutgoingIntegration | IUpdateOutgoingIntegration,
): Promise<IIntegration | null> => {
	const integration = await validateOutgoingIntegration(_integration, userId);

	if (!integration.token || integration.token.trim() === '') {
		throw new Meteor.Error('error-invalid-token', 'Invalid token', {
			method: 'updateOutgoingIntegration',
		});
	}

	let currentIntegration: IIntegration | null;

	if (await hasPermissionAsync(userId, 'manage-outgoing-integrations')) {
		currentIntegration = await Integrations.findOneById(integrationId);
	} else if (await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')) {
		currentIntegration = await Integrations.findOne({
			'_id': integrationId,
			'_createdBy._id': userId,
		});
	} else {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'updateOutgoingIntegration',
		});
	}

	if (!currentIntegration) {
		throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
	}

	const oldScriptEngine = currentIntegration.scriptEngine;
	const scriptEngine = integration.scriptEngine ?? oldScriptEngine ?? 'isolated-vm';
	if (
		integration.script?.trim() &&
		(scriptEngine !== oldScriptEngine || integration.script?.trim() !== currentIntegration.script?.trim())
	) {
		wrapExceptions(() => validateScriptEngine(scriptEngine)).catch((e) => {
			throw new Meteor.Error(e.message);
		});
	}

	const isFrozen = isScriptEngineFrozen(scriptEngine);

	const updatedIntegration = await Integrations.findOneAndUpdate(
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
				...(isFrozen
					? {}
					: {
							script: integration.script,
							scriptEnabled: integration.scriptEnabled,
							scriptEngine,
							...(integration.scriptCompiled ? { scriptCompiled: integration.scriptCompiled } : { scriptError: integration.scriptError }),
						}),
				triggerWords: integration.triggerWords,
				retryFailedCalls: integration.retryFailedCalls,
				retryCount: integration.retryCount,
				retryDelay: integration.retryDelay,
				triggerWordAnywhere: integration.triggerWordAnywhere,
				runOnEdits: integration.runOnEdits,
				_updatedAt: new Date(),
				_updatedBy: await Users.findOne({ _id: userId }, { projection: { username: 1 } }),
			},
			...(isFrozen
				? {}
				: {
						$unset: {
							...(integration.scriptCompiled ? { scriptError: 1 as const } : { scriptCompiled: 1 as const }),
						},
					}),
		},
		{ returnDocument: 'after' },
	);

	if (updatedIntegration) {
		await notifyOnIntegrationChanged(updatedIntegration);
	}

	return updatedIntegration;
};

Meteor.methods<ServerMethods>({
	async updateOutgoingIntegration(integrationId, _integration) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'updateOutgoingIntegration',
			});
		}

		return updateOutgoingIntegration(this.userId, integrationId, _integration);
	},
});
