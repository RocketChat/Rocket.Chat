/* global Babel */
import _ from 'underscore';
import s from 'underscore.string';
const scopedChannels = ['all_public_channels', 'all_private_groups', 'all_direct_messages'];
const validChannelChars = ['@', '#'];

function _verifyRequiredFields(integration) {
	if (!integration.event || !Match.test(integration.event, String) || integration.event.trim() === '' || !RocketChat.integrations.outgoingEvents[integration.event]) {
		throw new Meteor.Error('error-invalid-event-type', 'Invalid event type', { function: 'validateOutgoing._verifyRequiredFields' });
	}

	if (!integration.username || !Match.test(integration.username, String) || integration.username.trim() === '') {
		throw new Meteor.Error('error-invalid-username', 'Invalid username', { function: 'validateOutgoing._verifyRequiredFields' });
	}

	if (RocketChat.integrations.outgoingEvents[integration.event].use.targetRoom && !integration.targetRoom) {
		throw new Meteor.Error('error-invalid-targetRoom', 'Invalid Target Room', { function: 'validateOutgoing._verifyRequiredFields' });
	}

	if (!Match.test(integration.urls, [String])) {
		throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', { function: 'validateOutgoing._verifyRequiredFields' });
	}

	for (const [index, url] of integration.urls.entries()) {
		if (url.trim() === '') {
			delete integration.urls[index];
		}
	}

	integration.urls = _.without(integration.urls, [undefined]);

	if (integration.urls.length === 0) {
		throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', { function: 'validateOutgoing._verifyRequiredFields' });
	}
}

function _verifyUserHasPermissionForChannels(integration, userId, channels) {
	for (let channel of channels) {
		if (scopedChannels.includes(channel)) {
			if (channel === 'all_public_channels') {
				// No special permissions needed to add integration to public channels
			} else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { function: 'validateOutgoing._verifyUserHasPermissionForChannels' });
			}
		} else {
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
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { function: 'validateOutgoing._verifyUserHasPermissionForChannels' });
			}

			if (record.usernames && !RocketChat.authz.hasPermission(userId, 'manage-integrations') && RocketChat.authz.hasPermission(userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { function: 'validateOutgoing._verifyUserHasPermissionForChannels' });
			}
		}
	}
}

function _verifyRetryInformation(integration) {
	if (!integration.retryFailedCalls) {
		return;
	}

	// Don't allow negative retry counts
	integration.retryCount = integration.retryCount && parseInt(integration.retryCount) > 0 ? parseInt(integration.retryCount) : 4;
	integration.retryDelay = !integration.retryDelay || !integration.retryDelay.trim() ? 'powers-of-ten' : integration.retryDelay.toLowerCase();
}

RocketChat.integrations.validateOutgoing = function _validateOutgoing(integration, userId) {
	if (integration.channel && Match.test(integration.channel, String) && integration.channel.trim() === '') {
		delete integration.channel;
	}

	//Moved to it's own function to statisfy the complexity rule
	_verifyRequiredFields(integration);

	let channels = [];
	if (RocketChat.integrations.outgoingEvents[integration.event].use.channel) {
		if (!Match.test(integration.channel, String)) {
			throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', { function: 'validateOutgoing' });
		} else {
			channels = _.map(integration.channel.split(','), (channel) => s.trim(channel));

			for (const channel of channels) {
				if (!validChannelChars.includes(channel[0]) && !scopedChannels.includes(channel.toLowerCase())) {
					throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { function: 'validateOutgoing' });
				}
			}
		}
	} else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
		throw new Meteor.Error('error-invalid-permissions', 'Invalid permission for required Integration creation.', { function: 'validateOutgoing' });
	}

	if (RocketChat.integrations.outgoingEvents[integration.event].use.triggerWords && integration.triggerWords) {
		if (!Match.test(integration.triggerWords, [String])) {
			throw new Meteor.Error('error-invalid-triggerWords', 'Invalid triggerWords', { function: 'validateOutgoing' });
		}

		integration.triggerWords.forEach((word, index) => {
			if (!word || word.trim() === '') {
				delete integration.triggerWords[index];
			}
		});

		integration.triggerWords = _.without(integration.triggerWords, [undefined]);
	} else {
		delete integration.triggerWords;
	}

	if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
		try {
			const babelOptions = Object.assign(Babel.getDefaultOptions({ runtime: false }), { compact: true, minified: true, comments: false });

			integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
			integration.scriptError = undefined;
		} catch (e) {
			integration.scriptCompiled = undefined;
			integration.scriptError = _.pick(e, 'name', 'message', 'stack');
		}
	}

	if (typeof integration.runOnEdits !== 'undefined') {
		// Verify this value is only true/false
		integration.runOnEdits = integration.runOnEdits === true;
	}

	_verifyUserHasPermissionForChannels(integration, userId, channels);
	_verifyRetryInformation(integration);

	const user = RocketChat.models.Users.findOne({ username: integration.username });

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user (did you delete the `rocket.cat` user?)', { function: 'validateOutgoing' });
	}

	integration.type = 'webhook-outgoing';
	integration.userId = user._id;
	integration.channel = channels;

	return integration;
};
