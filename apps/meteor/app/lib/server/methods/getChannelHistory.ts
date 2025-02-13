import { Authorization } from '@rocket.chat/core-services';
import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../../authorization/server';
import { settings } from '../../../settings/server/cached';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getHiddenSystemMessages } from '../lib/getHiddenSystemMessages';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getChannelHistory(params: {
			rid: string;
			latest?: Date;
			oldest?: Date;
			inclusive?: boolean;
			offset?: number;
			count?: number;
			unreads?: boolean;
			showThreadMessages?: boolean;
		}): boolean | IMessage[] | { messages: IMessage[]; firstUnread?: any; unreadNotLoaded?: number };
	}
}

Meteor.methods<ServerMethods>({
	async getChannelHistory({ rid, latest, oldest, inclusive, offset = 0, count = 20, unreads, showThreadMessages = true }) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getChannelHistory' });
		}

		const fromUserId = Meteor.userId();
		if (!fromUserId) {
			return false;
		}

		const room = await Rooms.findOneById(rid);
		if (!room) {
			return false;
		}

		if (!(await canAccessRoomAsync(room, { _id: fromUserId }))) {
			return false;
		}

		// Make sure they can access the room
		if (!Authorization.canReadRoom(fromUserId, { roomType: room.t, rid: room._id })) {
			return false;
		}

		// Ensure latest is always defined.
		if (latest === undefined) {
			latest = new Date();
		}

		// Verify oldest is a date if it exists

		if (oldest !== undefined && {}.toString.call(oldest) !== '[object Date]') {
			throw new Meteor.Error('error-invalid-date', 'Invalid date', { method: 'getChannelHistory' });
		}

		const hiddenSystemMessages = settings.get<MessageTypesValues[]>('Hide_System_Messages');

		const hiddenMessageTypes = getHiddenSystemMessages(room, hiddenSystemMessages);

		const options: Record<string, unknown> = {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		};

		const records =
			oldest === undefined
				? await Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
						rid,
						latest,
						hiddenMessageTypes,
						options,
						showThreadMessages,
						inclusive,
					).toArray()
				: await Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
						rid,
						oldest,
						latest,
						hiddenMessageTypes,
						options,
						showThreadMessages,
						inclusive,
					).toArray();

		const messages = await normalizeMessagesForUser(records, fromUserId);

		if (unreads) {
			let unreadNotLoaded = 0;
			let firstUnread = undefined;

			if (oldest !== undefined) {
				const firstMsg = messages[messages.length - 1];
				if (firstMsg !== undefined && firstMsg.ts > oldest) {
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

					const totalCursor = await Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
						rid,
						oldest,
						firstMsg.ts,
						hiddenMessageTypes,
						showThreadMessages,
					);

					firstUnread = (await unreadMessages.toArray())[0];
					unreadNotLoaded = totalCursor;
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
