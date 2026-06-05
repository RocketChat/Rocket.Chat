import type { IRoom, IUser } from '@rocket.chat/core-typings';

export const getUidDirectMessage = (room: Pick<IRoom, 't' | 'uids' | 'usernames'>, uid?: IUser['_id']): string | undefined => {
	if (room.t !== 'd' || !room.uids?.length || room.uids.length > 2) {
		return undefined;
	}

	const partner = room.uids.find((_uid) => _uid !== uid);
	if (partner) {
		return partner;
	}

	if (room.uids.length === 1 && room.usernames?.length === 1) {
		return uid;
	}

	return undefined;
};
