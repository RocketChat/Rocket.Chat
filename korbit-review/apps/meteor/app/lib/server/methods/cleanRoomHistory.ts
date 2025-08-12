import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { findRoomByIdOrName } from '../../../api/server/v1/rooms';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { cleanRoomHistory } from '../functions/cleanRoomHistory';

type CleanRoomHistoryParams = {
	roomId: string;
	latest: Date;
	oldest: Date;
	inclusive?: boolean;
	limit?: number;
	excludePinned?: boolean;
	ignoreDiscussion?: boolean;
	filesOnly?: boolean;
	fromUsers?: string[];
	ignoreThreads?: boolean;
};
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		cleanRoomHistory(data: CleanRoomHistoryParams): number;
	}
}

export const cleanRoomHistoryMethod = async (
	userId: string,
	{
		roomId,
		latest,
		oldest,
		inclusive = true,
		limit,
		excludePinned = false,
		ignoreDiscussion = true,
		filesOnly = false,
		fromUsers = [],
		ignoreThreads,
	}: CleanRoomHistoryParams,
): Promise<number> => {
	if (!(await hasPermissionAsync(userId, 'clean-channel-history', roomId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
	}

	const room = await findRoomByIdOrName({ params: { roomId } });

	if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
	}

	return cleanRoomHistory({
		rid: roomId,
		latest,
		oldest,
		inclusive,
		limit,
		excludePinned,
		ignoreDiscussion,
		filesOnly,
		fromUsers,
		ignoreThreads,
	});
};

Meteor.methods<ServerMethods>({
	async cleanRoomHistory({
		roomId,
		latest,
		oldest,
		inclusive = true,
		limit,
		excludePinned = false,
		ignoreDiscussion = true,
		filesOnly = false,
		fromUsers = [],
		ignoreThreads,
	}) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);
		check(limit, Match.Maybe(Number));
		check(excludePinned, Match.Maybe(Boolean));
		check(filesOnly, Match.Maybe(Boolean));
		check(ignoreThreads, Match.Maybe(Boolean));
		check(fromUsers, Match.Maybe([String]));

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		return cleanRoomHistoryMethod(userId, {
			roomId,
			latest,
			oldest,
			inclusive,
			limit,
			excludePinned,
			ignoreDiscussion,
			filesOnly,
			fromUsers,
			ignoreThreads,
		});
	},
});
