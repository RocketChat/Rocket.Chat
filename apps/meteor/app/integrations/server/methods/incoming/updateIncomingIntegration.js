import { Meteor } from 'meteor/meteor';
import { Babel } from 'meteor/babel-compiler';
import _ from 'underscore';
import s from 'underscore.string';

import { Rooms, Users, Subscriptions } from '../../../../models/server';
import { Integrations, Roles } from '../../../../models/server/raw';
import { hasAllPermission, hasPermission } from '../../../../authorization/server';

const validChannelChars = ['@', '#'];

Meteor.methods({
	async updateIncomingIntegration(integrationId, integration) {
		if (!_.isString(integration.channel) || integration.channel.trim() === '') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
				method: 'updateIncomingIntegration',
			});
		}

		const channels = _.map(integration.channel.split(','), (channel) => s.trim(channel));

		for (const channel of channels) {
			if (!validChannelChars.includes(channel[0])) {
				throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
					method: 'updateIncomingIntegration',
				});
			}
		}

		let currentIntegration;

		if (hasPermission(this.userId, 'manage-incoming-integrations')) {
			currentIntegration = await Integrations.findOneById(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-incoming-integrations')) {
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

		if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
			try {
				let babelOptions = Babel.getDefaultOptions({ runtime: false });
				babelOptions = _.extend(babelOptions, { compact: true, minified: true, comments: false });

				integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
				integration.scriptError = undefined;
				await Integrations.updateOne(
					{ _id: integrationId },
					{
						$set: { scriptCompiled: integration.scriptCompiled },
						$unset: { scriptError: 1 },
					},
				);
			} catch (e) {
				integration.scriptCompiled = undefined;
				integration.scriptError = _.pick(e, 'name', 'message', 'stack');
				await Integrations.updateOne(
					{ _id: integrationId },
					{
						$set: {
							scriptError: integration.scriptError,
						},
						$unset: {
							scriptCompiled: 1,
						},
					},
				);
			}
		}

		for (let channel of channels) {
			const channelType = channel[0];
			channel = channel.substr(1);
			let record;

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
					method: 'updateIncomingIntegration',
				});
			}

			if (
				!hasAllPermission(this.userId, ['manage-incoming-integrations', 'manage-own-incoming-integrations']) &&
				!Subscriptions.findOneByRoomIdAndUserId(record._id, this.userId, { fields: { _id: 1 } })
			) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
					method: 'updateIncomingIntegration',
				});
			}
		}

		const user = Users.findOne({ username: currentIntegration.username });

		if (!user || !user._id) {
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
					script: integration.script,
					scriptEnabled: integration.scriptEnabled,
					_updatedAt: new Date(),
					_updatedBy: Users.findOne(this.userId, { fields: { username: 1 } }),
				},
			},
		);

		return Integrations.findOneById(integrationId);
	},
});
