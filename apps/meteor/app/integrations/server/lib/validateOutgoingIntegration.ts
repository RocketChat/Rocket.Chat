import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Babel } from 'meteor/babel-compiler';
import _ from 'underscore';
import type { IUser, INewOutgoingIntegration, IOutgoingIntegration, IUpdateOutgoingIntegration } from '@rocket.chat/core-typings';

import { Rooms, Users, Subscriptions } from '../../../models/server';
import { hasPermission, hasAllPermission } from '../../../authorization/server';
import { outgoingEvents } from '../../lib/outgoingEvents';
import { parseCSV } from '../../../../lib/utils/parseCSV';

const scopedChannels = ['all_public_channels', 'all_private_groups', 'all_direct_messages'];
const validChannelChars = ['@', '#'];

function _verifyRequiredFields(integration: INewOutgoingIntegration | IUpdateOutgoingIntegration): void {
	if (
		!integration.event ||
		!Match.test(integration.event, String) ||
		integration.event.trim() === '' ||
		!outgoingEvents[integration.event]
	) {
		throw new Meteor.Error('error-invalid-event-type', 'Invalid event type', {
			function: 'validateOutgoing._verifyRequiredFields',
		});
	}

	if (!integration.username || !Match.test(integration.username, String) || integration.username.trim() === '') {
		throw new Meteor.Error('error-invalid-username', 'Invalid username', {
			function: 'validateOutgoing._verifyRequiredFields',
		});
	}

	if (outgoingEvents[integration.event].use.targetRoom && !integration.targetRoom) {
		throw new Meteor.Error('error-invalid-targetRoom', 'Invalid Target Room', {
			function: 'validateOutgoing._verifyRequiredFields',
		});
	}

	if (!Match.test(integration.urls, [String])) {
		throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
			function: 'validateOutgoing._verifyRequiredFields',
		});
	}

	integration.urls = integration.urls.filter((url) => url && url.trim() !== '');

	if (integration.urls.length === 0) {
		throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
			function: 'validateOutgoing._verifyRequiredFields',
		});
	}
}

function _verifyUserHasPermissionForChannels(userId: IUser['_id'], channels: string[]): void {
	for (let channel of channels) {
		if (scopedChannels.includes(channel)) {
			if (channel === 'all_public_channels') {
				// No special permissions needed to add integration to public channels
			} else if (!hasPermission(userId, 'manage-outgoing-integrations')) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
					function: 'validateOutgoing._verifyUserHasPermissionForChannels',
				});
			}
		} else {
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
					function: 'validateOutgoing._verifyUserHasPermissionForChannels',
				});
			}

			if (
				!hasAllPermission(userId, ['manage-outgoing-integrations', 'manage-own-outgoing-integrations']) &&
				!Subscriptions.findOneByRoomIdAndUserId(record._id, userId, { fields: { _id: 1 } })
			) {
				throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
					function: 'validateOutgoing._verifyUserHasPermissionForChannels',
				});
			}
		}
	}
}

function _verifyRetryInformation(integration: IOutgoingIntegration): void {
	if (!integration.retryFailedCalls) {
		return;
	}

	// Don't allow negative retry counts
	integration.retryCount =
		integration.retryCount && parseInt(String(integration.retryCount)) > 0 ? parseInt(String(integration.retryCount)) : 4;
	integration.retryDelay =
		!integration.retryDelay || !integration.retryDelay.trim() ? 'powers-of-ten' : integration.retryDelay.toLowerCase();
}

export const validateOutgoingIntegration = function (
	integration: INewOutgoingIntegration | IUpdateOutgoingIntegration,
	userId: IUser['_id'],
): IOutgoingIntegration {
	if (integration.channel && Match.test(integration.channel, String) && integration.channel.trim() === '') {
		delete integration.channel;
	}

	// Moved to it's own function to statisfy the complexity rule
	_verifyRequiredFields(integration);

	let channels: string[] = [];
	if (outgoingEvents[integration.event].use.channel) {
		if (!Match.test(integration.channel, String)) {
			throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
				function: 'validateOutgoing',
			});
		} else {
			channels = parseCSV(integration.channel);

			for (const channel of channels) {
				if (!validChannelChars.includes(channel[0]) && !scopedChannels.includes(channel.toLowerCase())) {
					throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
						function: 'validateOutgoing',
					});
				}
			}
		}
	} else if (!hasPermission(userId, 'manage-outgoing-integrations')) {
		throw new Meteor.Error('error-invalid-permissions', 'Invalid permission for required Integration creation.', {
			function: 'validateOutgoing',
		});
	}

	const user = Users.findOne({ username: integration.username });

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user (did you delete the `rocket.cat` user?)', { function: 'validateOutgoing' });
	}

	const integrationData: IOutgoingIntegration = {
		...integration,
		type: 'webhook-outgoing',
		channel: channels,
		userId: user._id,
		_createdAt: new Date(),
		_createdBy: Users.findOne(userId, { fields: { username: 1 } }),
	};

	if (outgoingEvents[integration.event].use.triggerWords && integration.triggerWords) {
		if (!Match.test(integration.triggerWords, [String])) {
			throw new Meteor.Error('error-invalid-triggerWords', 'Invalid triggerWords', {
				function: 'validateOutgoing',
			});
		}

		integrationData.triggerWords = integration.triggerWords.filter((word) => word && word.trim() !== '');
	} else {
		delete integrationData.triggerWords;
	}

	if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
		try {
			const babelOptions = Object.assign(Babel.getDefaultOptions({ runtime: false }), {
				compact: true,
				minified: true,
				comments: false,
			});

			integrationData.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
			integrationData.scriptError = undefined;
		} catch (e) {
			integrationData.scriptCompiled = undefined;
			integrationData.scriptError = _.pick(e, 'name', 'message', 'stack');
		}
	}

	if (typeof integration.runOnEdits !== 'undefined') {
		// Verify this value is only true/false
		integrationData.runOnEdits = integration.runOnEdits === true;
	}

	_verifyUserHasPermissionForChannels(userId, channels);
	_verifyRetryInformation(integrationData);

	return integrationData;
};
