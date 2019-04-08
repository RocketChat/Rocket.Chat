import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { Subscriptions, Messages } from '../../../models';
import { settings } from '../../../settings';
import { composeMessageObjectWithUser } from '../../../utils';
import _ from 'underscore';

Meteor.methods({
	getChannelHistory({ rid, latest, oldest, inclusive, offset = 0, count = 20, unreads }) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getChannelHistory' });
		}

		const fromUserId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromUserId);
		if (!room) {
			return false;
		}

		// Make sure they can access the room
		if (room.t === 'c' && !hasPermission(fromUserId, 'preview-c-room') && !Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId, { fields: { _id: 1 } })) {
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

		const options = {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			options.fields = { editedAt: 0 };
		}

		let records = [];
		if (_.isUndefined(oldest) && inclusive) {
			records = Messages.findVisibleByRoomIdBeforeTimestampInclusive(rid, latest, options).fetch();
		} else if (_.isUndefined(oldest) && !inclusive) {
			records = Messages.findVisibleByRoomIdBeforeTimestamp(rid, latest, options).fetch();
		} else if (!_.isUndefined(oldest) && inclusive) {
			records = Messages.findVisibleByRoomIdBetweenTimestampsInclusive(rid, oldest, latest, options).fetch();
		} else {
			records = Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, latest, options).fetch();
		}

		const messages = records.map((record) => composeMessageObjectWithUser(record, fromUserId));

		if (unreads) {
			let unreadNotLoaded = 0;
			let firstUnread = undefined;

			if (!_.isUndefined(oldest)) {
				const firstMsg = messages[messages.length - 1];
				if (!_.isUndefined(firstMsg) && firstMsg.ts > oldest) {
					const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, firstMsg.ts, { limit: 1, sort: { ts: 1 } });
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
