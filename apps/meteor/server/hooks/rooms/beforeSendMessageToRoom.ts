import type { IRoom } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const beforeSendMessageToRoom = makeFunction(async (_room: IRoom) => {
	// no op on CE
});
