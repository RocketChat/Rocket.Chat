import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

/** Whether a room's message history can be hidden from its members: channels, groups and their discussions, unless federated. */
export const canRestrictMessageHistory = (room: Pick<IRoom, 't' | 'federated'>): boolean =>
	(room.t === 'c' || room.t === 'p') && !isRoomFederated(room);
