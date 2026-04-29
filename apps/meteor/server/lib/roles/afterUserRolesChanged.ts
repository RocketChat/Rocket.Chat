import type { IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const afterUserRolesChanged = makeFunction(async (_userId: IUser['_id']): Promise<void> => {
	// default no-op
});
