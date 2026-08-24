import type { IRoom, Serialized } from '@rocket.chat/core-typings';

import { mapMessageFromApi } from './mapMessageFromApi';

// The REST payload serializes Date fields to strings; deserialize the room's date fields
// (and its nested lastMessage) back to Date so the room can be stored in the Date-typed Rooms state.
export const mapRoomFromApi = ({ _updatedAt, lm, lastMessage, ...room }: Serialized<IRoom>): IRoom =>
	({
		...room,
		_updatedAt: new Date(_updatedAt),
		...(lm && { lm: new Date(lm) }),
		...(lastMessage && { lastMessage: mapMessageFromApi(lastMessage) }),
	}) as unknown as IRoom;
