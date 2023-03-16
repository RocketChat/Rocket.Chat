import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadSurroundingMessages(
			message: Pick<IMessage, '_id' | 'rid'> & { ts?: Date },
			limit?: number,
		):
			| {
					messages: IMessage[];
					moreBefore: boolean;
					moreAfter: boolean;
			  }
			| false;
	}
}

Meteor.methods<ServerMethods>({
	loadSurroundingMessages(message, limit = 50) {
		check(message, Object);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadSurroundingMessages',
			});
		}

		const fromId = Meteor.userId() ?? undefined;

		if (!message._id) {
			return false;
		}

		message = Messages.findOneById(message._id);

		if (!message?.rid) {
			return false;
		}

		if (!canAccessRoomId(message.rid, fromId)) {
			return false;
		}

		limit -= 1;

		const options = {
			sort: {
				ts: -1,
			},
			limit: Math.ceil(limit / 2),
		};

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
			messages: fromId ? normalizeMessagesForUser(messages, fromId) : messages,
			moreBefore,
			moreAfter,
		};
	},
});
