import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const scopeAdminRoomForAbac = makeFunction(
	async (room: Pick<IRoom, RoomAdminFieldsType>, _uid: string): Promise<Pick<IRoom, RoomAdminFieldsType>> => room,
);
