import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getHiddenSystemMessages } from '../lib/getHiddenSystemMessages';

declare module '@rocket.chat/ui-contexts' {
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
		if (
			room.t === 'c' &&
			!(await hasPermissionAsync(fromUserId, 'preview-c-room')) &&
			!(await Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId, { projection: { _id: 1 } }))
		) {
			return false;
		}

		// Ensure latest is always defined.
		if (latest === undefined) {
			latest = new Date();
		}

		// Verify oldest is a date if it exists
		if (oldest !== undefined && !_.isDate(oldest)) {
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
