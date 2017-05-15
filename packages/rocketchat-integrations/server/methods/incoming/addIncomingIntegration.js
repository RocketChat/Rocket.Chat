/* global Babel */
const validChannelChars = ['@', '#'];

Meteor.methods({
	addIncomingIntegration(integration) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
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
					record = RocketChat.models.Rooms.findOne({
						$or: [
							{_id: channel},
							{name: channel}
						]
					});
					break;
				case '@':
					record = RocketChat.models.Users.findOne({
						$or: [
							{_id: channel},
							{username: channel}
						]
					});
					break;
			}

			if (!record) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'addIncomingIntegration' });
			}

			if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { method: 'addIncomingIntegration' });
			}
		}

		const user = RocketChat.models.Users.findOne({username: integration.username});

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addIncomingIntegration' });
		}

		const token = Random.id(48);

		integration.type = 'webhook-incoming';
		integration.token = token;
		integration.channel = channels;
		integration.userId = user._id;
		integration._createdAt = new Date();
		integration._createdBy = RocketChat.models.Users.findOne(this.userId, {fields: {username: 1}});

		RocketChat.models.Roles.addUserRoles(user._id, 'bot');

		integration._id = RocketChat.models.Integrations.insert(integration);

		return integration;
	}
});
