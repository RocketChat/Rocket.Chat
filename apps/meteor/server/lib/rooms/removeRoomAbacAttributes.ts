import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { afterRemoveRoomAbacAttributes } from '../../hooks/rooms/afterRemoveRoomAbacAttributes';
import { beforeRemoveRoomAbacAttributes } from '../../hooks/rooms/beforeRemoveRoomAbacAttributes';
import { notifyOnRoomChangedById } from '../notifyListener';

export const assertCanRemoveRoomAbacAttributes = async (
	room: Pick<IRoom, '_id' | 'abacAttributes'>,
	actor: Pick<IUser, '_id' | 'username' | 'name'>,
): Promise<void> => {
	if (!room.abacAttributes?.length) {
		return;
	}

	await beforeRemoveRoomAbacAttributes(room, actor);
};

export const removeRoomAbacAttributes = async (
	room: Pick<IRoom, '_id' | 'name' | 'abacAttributes'>,
	actor: Pick<IUser, '_id' | 'username' | 'name'>,
): Promise<void> => {
	if (!room.abacAttributes?.length) {
		return;
	}

	await Rooms.unsetAbacAttributesById(room._id);
	void notifyOnRoomChangedById(room._id);

	await afterRemoveRoomAbacAttributes(room, actor);
};
