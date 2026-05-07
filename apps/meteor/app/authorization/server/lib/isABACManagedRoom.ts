import type { IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

export const isABACManagedRoom = (room: Pick<IRoom, 't' | 'abacAttributes'>): boolean =>
	room.t === 'p' && settings.get<boolean>('ABAC_Enabled') && Array.isArray(room.abacAttributes) && room.abacAttributes.length > 0;

export const stripABACManagedFieldsForAdmin = <T extends Pick<IRoom, 't' | 'abacAttributes'>>(room: T): T => {
	if (!isABACManagedRoom(room)) {
		return room;
	}
	const { announcement, topic, description, ...rest } = room as T & Pick<IRoom, 'announcement' | 'topic' | 'description'>;
	return rest as T;
};
