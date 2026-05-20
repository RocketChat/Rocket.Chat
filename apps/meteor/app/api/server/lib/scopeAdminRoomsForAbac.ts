import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const scopeAdminRoomsForAbac = makeFunction(
	async (rooms: Pick<IRoom, RoomAdminFieldsType>[], _uid: string): Promise<Pick<IRoom, RoomAdminFieldsType>[]> => rooms,
);
