import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages } from '../../app/models';
import { settings } from '../../app/settings';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

Meteor.methods({
	loadSurroundingMessages(message, limit = 50) {
		check(message, Object);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadSurroundingMessages',
			});
		}

		const fromId = Meteor.userId();

		if (!message._id) {
			return false;
		}

		message = Messages.findOneById(message._id);

		if (!message || !message.rid) {
			return false;
		}

		if (!Meteor.call('canAccessRoom', message.rid, fromId)) {
			return false;
		}

		limit = limit - 1;

		const options = {
			sort: {
				ts: -1,
			},
			limit: Math.ceil(limit / 2),
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			options.fields = {
				editedAt: 0,
			};
		}

		const messages = Messages.findVisibleByRoomIdBeforeTimestamp(message.rid, message.ts, options).fetch();

		const moreBefore = messages.length === options.limit;

		messages.push(message);

		options.sort = {
			ts: 1,
		};

		options.limit = Math.floor(limit / 2);

		const afterMessages = Messages.findVisibleByRoomIdAfterTimestamp(message.rid, message.ts, options).fetch();

		const moreAfter = afterMessages.length === options.limit;

		messages.push(...afterMessages);

		return {
			messages: normalizeMessagesForUser(messages, fromId),
			moreBefore,
			moreAfter,
		};
	},
});
