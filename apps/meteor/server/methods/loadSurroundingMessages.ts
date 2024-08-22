import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

declare module '@rocket.chat/ddp-client' {
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
	async loadSurroundingMessages(message, limit = 50) {
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

		const mainMessage = await Messages.findOneById(message._id);

		if (!mainMessage?.rid) {
			return false;
		}

		if (!(await canAccessRoomIdAsync(mainMessage.rid, fromId))) {
			return false;
		}

		limit -= 1;

		const options: FindOptions<IMessage> = {
			sort: {
				ts: -1,
			},
			limit: Math.ceil(limit / 2),
		};

		const messages = await Messages.findVisibleByRoomIdBeforeTimestamp(mainMessage.rid, mainMessage.ts, options).toArray();

		const moreBefore = messages.length === options.limit;

		messages.push(mainMessage);

		options.sort = {
			ts: 1,
		};

		options.limit = Math.floor(limit / 2);

		const afterMessages = await Messages.findVisibleByRoomIdAfterTimestamp(mainMessage.rid, mainMessage.ts, options).toArray();

		const moreAfter = afterMessages.length === options.limit;

		messages.push(...afterMessages);

		return {
			messages: fromId ? await normalizeMessagesForUser(messages, fromId) : messages,
			moreBefore,
			moreAfter,
		};
	},
});
