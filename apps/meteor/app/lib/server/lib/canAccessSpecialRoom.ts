import type { RoomAccessValidator } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const canAccessSpecialRoom = makeFunction(async (_room: IRoom, _user: IUser): Promise<boolean> => {
	// On default, we ignore the hook, and let the other checks run
	return false;
});

export const specialAccessValidators: RoomAccessValidator[] = [canAccessSpecialRoom as unknown as RoomAccessValidator];
