import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { canAccessRoom, hasPermission } from '../../../authorization/server';
import { Subscriptions, Messages, Rooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getHiddenSystemMessages } from '../lib/getHiddenSystemMessages';

Meteor.methods({
	getChannelHistory({ rid, latest, oldest, inclusive, offset = 0, count = 20, unreads, showThreadMessages = true }) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getChannelHistory' });
		}

		const fromUserId = Meteor.userId() || undefined;
		const room = Rooms.findOneById(rid);
		if (!room) {
			return false;
		}

		if (!canAccessRoom(room, { _id: fromUserId })) {
			return false;
		}

		// Make sure they can access the room
		if (
			room.t === 'c' &&
			!hasPermission(fromUserId, 'preview-c-room') &&
			!Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId, { fields: { _id: 1 } })
		) {
			return false;
		}

		// Ensure latest is always defined.
		if (_.isUndefined(latest)) {
			latest = new Date();
		}

		// Verify oldest is a date if it exists
		if (!_.isUndefined(oldest) && !_.isDate(oldest)) {
			throw new Meteor.Error('error-invalid-date', 'Invalid date', { method: 'getChannelHistory' });
		}

		const hiddenMessageTypes = getHiddenSystemMessages(room);

		const options: Record<string, unknown> = {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			options.fields = { editedAt: 0 };
		}

		const records = _.isUndefined(oldest)
			? Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
					rid,
					latest,
					hiddenMessageTypes,
					options,
					showThreadMessages,
					inclusive,
			  ).fetch()
			: Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
					rid,
					oldest,
					latest,
					hiddenMessageTypes,
					options,
					showThreadMessages,
					inclusive,
			  ).fetch();

		const messages = normalizeMessagesForUser(records, fromUserId);

		if (unreads) {
			let unreadNotLoaded = 0;
			let firstUnread = undefined;

			if (!_.isUndefined(oldest)) {
				const firstMsg = messages[messages.length - 1];
				if (!_.isUndefined(firstMsg) && firstMsg.ts > oldest) {
					const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
						rid,
						oldest,
						firstMsg.ts,
						hiddenMessageTypes,
						{
							limit: 1,
							sort: {
								ts: 1,
							},
						},
						showThreadMessages,
					);

					firstUnread = unreadMessages.fetch()[0];
					unreadNotLoaded = unreadMessages.count();
				}
			}

			return {
				messages: messages || [],
				firstUnread,
				unreadNotLoaded,
			};
		}

		return {
			messages: messages || [],
		};
	},
});
