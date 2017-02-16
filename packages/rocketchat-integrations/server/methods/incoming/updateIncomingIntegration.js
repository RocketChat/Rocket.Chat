/* global Babel */
const validChannelChars = ['@', '#'];

Meteor.methods({
	updateIncomingIntegration(integrationId, integration) {
		if (!_.isString(integration.channel) || integration.channel.trim() === '') {
			throw new Meteor.Error('error-invalid-channel', 'Invalid channel', { method: 'updateIncomingIntegration' });
		}

		const channels = _.map(integration.channel.split(','), (channel) => s.trim(channel));

		for (const channel of channels) {
			if (!validChannelChars.includes(channel[0])) {
				throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { method: 'updateIncomingIntegration' });
			}
		}

		let currentIntegration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
			currentIntegration = RocketChat.models.Integrations.findOne({ _id: integrationId, '_createdBy._id': this.userId });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'updateIncomingIntegration' });
		}

		if (!currentIntegration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'updateIncomingIntegration' });
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
			const channelType = channel[0];
			channel = channel.substr(1);
			let record;

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
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'updateIncomingIntegration' });
			}

			if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { method: 'updateIncomingIntegration' });
			}
		}

		const user = RocketChat.models.Users.findOne({ username: currentIntegration.username });
		RocketChat.models.Roles.addUserRoles(user._id, 'bot');

		RocketChat.models.Integrations.update(integrationId, {
			$set: {
				enabled: integration.enabled,
				name: integration.name,
				avatar: integration.avatar,
				emoji: integration.emoji,
				alias: integration.alias,
				channel: channels,
				script: integration.script,
				scriptEnabled: integration.scriptEnabled,
				scriptCompiled: integration.scriptCompiled,
				scriptError: integration.scriptError,
				_updatedAt: new Date(),
				_updatedBy: RocketChat.models.Users.findOne(this.userId, {fields: {username: 1}})
			}
		});

		return RocketChat.models.Integrations.findOne(integrationId);
	}
});
