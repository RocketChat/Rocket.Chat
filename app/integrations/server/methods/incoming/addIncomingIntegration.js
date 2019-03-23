import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Babel } from 'meteor/babel-compiler';
import { hasPermission, hasAllPermission } from '../../../../authorization';
import { Users, Rooms, Integrations, Roles, Subscriptions } from '../../../../models';
import _ from 'underscore';
import s from 'underscore.string';
const validChannelChars = ['@', '#'];

Meteor.methods({
	addIncomingIntegration(integration) {
		if (!hasPermission(this.userId, 'manage-incoming-integrations') && !hasPermission(this.userId, 'manage-own-incoming-integrations')) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'addIncomingIntegration' });
		}

		if (!_.isString(integration.channel)) {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', { method: 'addIncomingIntegration' });
		}

		if (integration.channel.trim() === '') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', { method: 'addIncomingIntegration' });
		}

		const channels = _.map(integration.channel.split(','), (channel) => s.trim(channel));

		for (const channel of channels) {
			if (!validChannelChars.includes(channel[0])) {
				throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { method: 'updateIncomingIntegration' });
			}
		}

		if (!_.isString(integration.username) || integration.username.trim() === '') {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'addIncomingIntegration' });
		}

		if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
			try {
				let babelOptions = Babel.getDefaultOptions({ runtime: false });
				babelOptions = _.extend(babelOptions, { compact: true, minified: true, comments: false });

				integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
				integration.scriptError = undefined;
			} catch (e) {
				integration.scriptCompiled = undefined;
				integration.scriptError = _.pick(e, 'name', 'message', 'stack');
			}
		}

		for (let channel of channels) {
			let record;
			const channelType = channel[0];
			channel = channel.substr(1);

			switch (channelType) {
				case '#':
					record = Rooms.findOne({
						$or: [
							{ _id: channel },
							{ name: channel },
						],
					});
					break;
				case '@':
					record = Users.findOne({
						$or: [
							{ _id: channel },
							{ username: channel },
						],
					});
					break;
			}

			if (!record) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'addIncomingIntegration' });
			}

			if (!hasAllPermission(this.userId, ['manage-incoming-integrations', 'manage-own-incoming-integrations']) && !Subscriptions.findOneByRoomIdAndUserId(record._id, this.userId, { fields: { _id: 1 } })) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { method: 'addIncomingIntegration' });
			}
		}

		const user = Users.findOne({ username: integration.username });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addIncomingIntegration' });
		}

		const token = Random.id(48);

		integration.type = 'webhook-incoming';
		integration.token = token;
		integration.channel = channels;
		integration.userId = user._id;
		integration._createdAt = new Date();
		integration._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });

		Roles.addUserRoles(user._id, 'bot');

		integration._id = Integrations.insert(integration);

		return integration;
	},
});
