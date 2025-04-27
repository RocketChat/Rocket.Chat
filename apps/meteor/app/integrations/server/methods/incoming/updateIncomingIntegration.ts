import type { IIntegration, INewIncomingIntegration, IUpdateIncomingIntegration } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations, Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import { Babel } from 'meteor/babel-compiler';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { addUserRolesAsync } from '../../../../../server/lib/roles/addUserRoles';
import { hasAllPermissionAsync, hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { notifyOnIntegrationChanged } from '../../../../lib/server/lib/notifyListener';
import { isScriptEngineFrozen, validateScriptEngine } from '../../lib/validateScriptEngine';

const validChannelChars = ['@', '#'];

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateIncomingIntegration(
			integrationId: string,
			integration: INewIncomingIntegration | IUpdateIncomingIntegration,
		): IIntegration | null;
	}
}

function validateChannels(channelString: string | undefined): string[] {
	if (!channelString || typeof channelString.valueOf() !== 'string' || channelString.trim() === '') {
		throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
			method: 'updateIncomingIntegration',
		});
	}

	const channels = channelString.split(',').map((channel) => channel.trim());

	for (const channel of channels) {
		if (!validChannelChars.includes(channel[0])) {
			throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
				method: 'updateIncomingIntegration',
			});
		}
	}

	return channels;
}

export const updateIncomingIntegration = async (
	userId: string,
	integrationId: string,
	integration: INewIncomingIntegration | IUpdateIncomingIntegration,
): Promise<IIntegration | null> => {
	const channels = validateChannels(integration.channel);

	let currentIntegration;

	if (await hasPermissionAsync(userId, 'manage-incoming-integrations')) {
		currentIntegration = await Integrations.findOneById(integrationId);
	} else if (await hasPermissionAsync(userId, 'manage-own-incoming-integrations')) {
		currentIntegration = await Integrations.findOne({
			'_id': integrationId,
			'_createdBy._id': userId,
		});
	} else {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'updateIncomingIntegration',
		});
	}

	if (!currentIntegration) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'updateIncomingIntegration',
		});
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

	if (!isFrozen) {
		let scriptCompiled: string | undefined;
		let scriptError: Pick<Error, 'name' | 'message' | 'stack'> | undefined;

		if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
			try {
				let babelOptions = Babel.getDefaultOptions({ runtime: false });
				babelOptions = _.extend(babelOptions, { compact: true, minified: true, comments: false });

				scriptCompiled = Babel.compile(integration.script, babelOptions).code;
				scriptError = undefined;
				await Integrations.updateOne(
					{ _id: integrationId },
					{
						$set: {
							scriptCompiled,
						},
						$unset: { scriptError: 1 as const },
					},
				);
			} catch (e) {
				scriptCompiled = undefined;
				if (e instanceof Error) {
					const { name, message, stack } = e;
					scriptError = { name, message, stack };
				}
				await Integrations.updateOne(
					{ _id: integrationId },
					{
						$set: {
							scriptError,
						},
						$unset: {
							scriptCompiled: 1 as const,
						},
					},
				);
			}
		}
	}

	for await (let channel of channels) {
		const channelType = channel[0];
		channel = channel.slice(1);
		let record;

		switch (channelType) {
			case '#':
				record = await Rooms.findOne({
					$or: [{ _id: channel }, { name: channel }],
				});
				break;
			case '@':
				record = await Users.findOne({
					$or: [{ _id: channel }, { username: channel }],
				});
				break;
		}

		if (!record) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'updateIncomingIntegration',
			});
		}

		if (
			!(await hasAllPermissionAsync(userId, ['manage-incoming-integrations', 'manage-own-incoming-integrations'])) &&
			!(await Subscriptions.findOneByRoomIdAndUserId(record._id, userId, { projection: { _id: 1 } }))
		) {
			throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
				method: 'updateIncomingIntegration',
			});
		}
	}

	const username = 'username' in integration ? integration.username : currentIntegration.username;
	const user = await Users.findOne({ username });

	if (!user?._id) {
		throw new Meteor.Error('error-invalid-post-as-user', 'Invalid Post As User', {
			method: 'updateIncomingIntegration',
		});
	}

	await addUserRolesAsync(user._id, ['bot']);

	const updatedIntegration = await Integrations.findOneAndUpdate(
		{ _id: integrationId },
		{
			$set: {
				enabled: integration.enabled,
				name: integration.name,
				avatar: integration.avatar,
				emoji: integration.emoji,
				alias: integration.alias,
				channel: channels,
				...('username' in integration && { username: user.username, userId: user._id }),
				...(isFrozen
					? {}
					: {
							script: integration.script,
							scriptEnabled: integration.scriptEnabled,
							scriptEngine,
						}),
				...(typeof integration.overrideDestinationChannelEnabled !== 'undefined' && {
					overrideDestinationChannelEnabled: integration.overrideDestinationChannelEnabled,
				}),
				_updatedAt: new Date(),
				_updatedBy: await Users.findOne({ _id: userId }, { projection: { username: 1 } }),
			},
		},
		{ returnDocument: 'after' },
	);

	if (updatedIntegration) {
		void notifyOnIntegrationChanged(updatedIntegration);
	}

	return updatedIntegration;
};

Meteor.methods<ServerMethods>({
	// eslint-disable-next-line complexity
	async updateIncomingIntegration(integrationId, integration) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'updateOutgoingIntegration',
			});
		}

		return updateIncomingIntegration(this.userId, integrationId, integration);
	},
});
