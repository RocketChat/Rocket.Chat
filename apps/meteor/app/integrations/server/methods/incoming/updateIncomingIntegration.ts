import type { IIntegration, INewIncomingIntegration, IUpdateIncomingIntegration } from '@rocket.chat/core-typings';
import { Integrations, Roles, Subscriptions, Users, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Babel } from 'meteor/babel-compiler';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasAllPermissionAsync, hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

const validChannelChars = ['@', '#'];

const FREEZE_INTEGRATION_SCRIPTS = ['yes', 'true'].includes(String(process.env.FREEZE_INTEGRATION_SCRIPTS).toLowerCase());

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateIncomingIntegration(
			integrationId: string,
			integration: INewIncomingIntegration | IUpdateIncomingIntegration,
		): IIntegration | null;
	}
}

Meteor.methods<ServerMethods>({
	async updateIncomingIntegration(integrationId, integration) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'updateOutgoingIntegration',
			});
		}

		if (!integration.channel || typeof integration.channel.valueOf() !== 'string' || integration.channel.trim() === '') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
				method: 'updateIncomingIntegration',
			});
		}

		const channels = integration.channel.split(',').map((channel) => channel.trim());

		for (const channel of channels) {
			if (!validChannelChars.includes(channel[0])) {
				throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
					method: 'updateIncomingIntegration',
				});
			}
		}

		let currentIntegration;

		if (await hasPermissionAsync(this.userId, 'manage-incoming-integrations')) {
			currentIntegration = await Integrations.findOneById(integrationId);
		} else if (await hasPermissionAsync(this.userId, 'manage-own-incoming-integrations')) {
			currentIntegration = await Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
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

		if (FREEZE_INTEGRATION_SCRIPTS) {
			if (currentIntegration.script?.trim() !== integration.script?.trim()) {
				throw new Meteor.Error('integration-scripts-disabled');
			}
		} else {
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
				!(await hasAllPermissionAsync(this.userId, ['manage-incoming-integrations', 'manage-own-incoming-integrations'])) &&
				!(await Subscriptions.findOneByRoomIdAndUserId(record._id, this.userId, { projection: { _id: 1 } }))
			) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
					method: 'updateIncomingIntegration',
				});
			}
		}

		const user = await Users.findOne({ username: currentIntegration.username });

		if (!user?._id) {
			throw new Meteor.Error('error-invalid-post-as-user', 'Invalid Post As User', {
				method: 'updateIncomingIntegration',
			});
		}

		await Roles.addUserRoles(user._id, ['bot']);

		await Integrations.updateOne(
			{ _id: integrationId },
			{
				$set: {
					enabled: integration.enabled,
					name: integration.name,
					avatar: integration.avatar,
					emoji: integration.emoji,
					alias: integration.alias,
					channel: channels,
					...(FREEZE_INTEGRATION_SCRIPTS
						? {}
						: {
								script: integration.script,
								scriptEnabled: integration.scriptEnabled,
						  }),
					overrideDestinationChannelEnabled: integration.overrideDestinationChannelEnabled,
					_updatedAt: new Date(),
					_updatedBy: await Users.findOne({ _id: this.userId }, { projection: { username: 1 } }),
				},
			},
		);

		return Integrations.findOneById(integrationId);
	},
});
