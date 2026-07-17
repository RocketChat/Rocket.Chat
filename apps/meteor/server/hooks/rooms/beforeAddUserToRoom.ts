import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const beforeAddUserToRoom = makeFunction(async (_users: IUser['username'][], _room: IRoom, _actor?: IUser) => {
	// no op on CE
});
