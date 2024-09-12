import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'messages/get': (
			rid: IRoom['_id'],
			options: {
				lastUpdate?: Date;
				latestDate?: Date;
				oldestDate?: Date;
				inclusive?: boolean;
				count?: number;
				unreads?: boolean;
				next?: string;
				previous?: string;
			},
		) => Promise<{
			updated: IMessage[];
			deleted: IMessage[];
		}>;
	}
}

function extractTimestampFromCursor(cursor: string): Date {
	const [timestamp] = cursor.split('_');
	return new Date(parseInt(timestamp, 10));
}

function mountCursorQuery({
	next,
	previous,
}: {
	next?: string;
	previous?: string;
}): { ts: { $lt: Date } | { $gt: Date } | { $lte: Date } } | Record<string, never> {
	if (next) {
		return { ts: { $gt: extractTimestampFromCursor(next) } };
	}
	if (previous) {
		return { ts: { $lte: extractTimestampFromCursor(previous) } };
	}
	return {};
}

function mountCursor(message: IMessage): string {
	return `${message.ts.getTime()}_${message._id}`;
}

function mountNextCursor(messages: IMessage[]): string | null {
	if (messages.length) {
		return mountCursor(messages[0]);
	}

	return null;
}

function mountPreviousCursor(messages: IMessage[], count: number, next?: string): string | null {
	if (messages.length > count) {
		return mountCursor(messages[messages.length - 1]);
	}

	if (messages.length === 0 && next) {
		return next;
	}

	return null;
}

Meteor.methods<ServerMethods>({
	async 'messages/get'(
		rid,
		{ lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false, next, previous },
	) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'messages/get' });
		}

		if ((next || previous) && lastUpdate) {
			throw new Meteor.Error('error-cursor-and-lastUpdate-cannot-be-used-together', 'Cursor and lastUpdate cannot be used together');
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'messages/get' });
		}

		if (!(await canAccessRoomIdAsync(rid, fromId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'messages/get' });
		}

		const options: FindOptions<IMessage> = {
			sort: { ts: -1 },
			...(count && { limit: count + 1 }),
		};

		const query = {
			rid,
			...(lastUpdate && { ts: { $gt: lastUpdate } }),
			...mountCursorQuery({ next, previous }),
		};

		// TODO: Improve both queries - fix trash
		const [updatedMessages, deletedMessages] = await Promise.all([
			Messages.find(query, options).toArray(),
			Messages.trashFindDeletedAfter(lastUpdate || new Date(0), { rid }, { ...options, projection: { _id: 1, _deletedAt: 1 } }).toArray(),
		]);

		// if (lastUpdate instanceof Date) {
		// 	return {
		// 		updated: await Messages.findForUpdates(rid, lastUpdate, {
		// 			sort: {
		// 				ts: -1,
		// 			},
		// 		}).toArray(),
		// 		deleted: await Messages.trashFindDeletedAfter(lastUpdate, { rid }, { ...options, projection: { _id: 1, _deletedAt: 1 } }).toArray(),
		// 	};
		// }

		const hasPreviousPage = updatedMessages.length > count;

		const cursor = {
			next: mountNextCursor(updatedMessages),
			previous: mountPreviousCursor(updatedMessages, count, next),
		};

		if (hasPreviousPage) {
			updatedMessages.pop();
		}

		if (!lastUpdate && !next && !previous) {
			return Meteor.callAsync('getChannelHistory', {
				rid,
				latest: latestDate,
				oldest: oldestDate,
				inclusive,
				count,
				unreads,
			});
		}

		return {
			updated: updatedMessages,
			deleted: deletedMessages,
			cursor,
		};
	},
});
