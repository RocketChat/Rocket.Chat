import { Message } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

export const saveRoomHideHistoryForNewMembers = async (
	rid: IRoom['_id'],
	hideHistoryForNewMembers: boolean,
	user: Pick<IUser, '_id' | 'username' | 'name'>,
): Promise<void> => {
	await Rooms.setHideHistoryForNewMembersById(rid, hideHistoryForNewMembers);

	const type = hideHistoryForNewMembers ? 'room-set-history-hidden-for-new-members' : 'room-removed-history-hidden-for-new-members';
	await Message.saveSystemMessage(type, rid, '', user);
};
