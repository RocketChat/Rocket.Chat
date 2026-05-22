import { Meteor } from 'meteor/meteor';

import { findRoomByIdOrName } from '../../api/v1/rooms';
import { canAccessRoomAsync } from '../../lib/authorization';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { cleanRoomHistory } from '../../lib/rooms/cleanRoomHistory';

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
