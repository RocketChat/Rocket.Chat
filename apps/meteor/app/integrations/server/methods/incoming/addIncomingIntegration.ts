import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import { Babel } from 'meteor/babel-compiler';
import _ from 'underscore';
import type { INewIncomingIntegration, IIncomingIntegration } from '@rocket.chat/core-typings';
import { Integrations, Roles, Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync, hasAllPermission } from '../../../../authorization/server/functions/hasPermission';
import { Users, Rooms } from '../../../../models/server';

const validChannelChars = ['@', '#'];

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addIncomingIntegration(integration: INewIncomingIntegration): Promise<IIncomingIntegration>;
	}
}

Meteor.methods<ServerMethods>({
	async addIncomingIntegration(integration: INewIncomingIntegration): Promise<IIncomingIntegration> {
		const { userId } = this;

		check(
			integration,
			Match.ObjectIncluding({
				type: String,
				name: String,
				enabled: Boolean,
				username: String,
				channel: String,
				alias: Match.Maybe(String),
				emoji: Match.Maybe(String),
				scriptEnabled: Boolean,
				script: Match.Maybe(String),
				avatar: Match.Maybe(String),
			}),
		);

		if (
			!userId ||
			(!(await hasPermissionAsync(userId, 'manage-incoming-integrations')) &&
				!(await hasPermissionAsync(userId, 'manage-own-incoming-integrations')))
		) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'addIncomingIntegration',
			});
		}

		if (!integration.channel || typeof integration.channel.valueOf() !== 'string') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
				method: 'addIncomingIntegration',
			});
		}

		if (integration.channel.trim() === '') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
				method: 'addIncomingIntegration',
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

		if (!integration.username || typeof integration.username.valueOf() !== 'string' || integration.username.trim() === '') {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', {
				method: 'addIncomingIntegration',
			});
		}

		const user = Users.findOne({ username: integration.username });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addIncomingIntegration',
			});
		}

		const integrationData: IIncomingIntegration = {
			...integration,
			type: 'webhook-incoming',
			channel: channels,
			token: Random.id(48),
			userId: user._id,
			_createdAt: new Date(),
			_createdBy: Users.findOne(userId, { fields: { username: 1 } }),
		};

		if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
			try {
				let babelOptions = Babel.getDefaultOptions({ runtime: false });
				babelOptions = _.extend(babelOptions, { compact: true, minified: true, comments: false });

				integrationData.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
				integrationData.scriptError = undefined;
			} catch (e) {
				integrationData.scriptCompiled = undefined;
				integrationData.scriptError = e instanceof Error ? _.pick(e, 'name', 'message', 'stack') : undefined;
			}
		}

		for await (let channel of channels) {
			let record;
			const channelType = channel[0];
			channel = channel.substr(1);

			switch (channelType) {
				case '#':
					record = Rooms.findOne({
						$or: [{ _id: channel }, { name: channel }],
					});
					break;
				case '@':
					record = Users.findOne({
						$or: [{ _id: channel }, { username: channel }],
					});
					break;
			}

			if (!record) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', {
					method: 'addIncomingIntegration',
				});
			}

			if (
				!hasAllPermission(userId, ['manage-incoming-integrations', 'manage-own-incoming-integrations']) &&
				!(await Subscriptions.findOneByRoomIdAndUserId(record._id, userId, { projection: { _id: 1 } }))
			) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
					method: 'addIncomingIntegration',
				});
			}
		}

		await Roles.addUserRoles(user._id, ['bot']);

		const result = await Integrations.insertOne(integrationData);

		integrationData._id = result.insertedId;

		return integrationData;
	},
});
