import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export type AbacEvaluableUser = Pick<IUser, '_id' | 'username'>;

export type FilterUsersAllowedInRoomOptions = { audit?: boolean };

export const filterUsersAllowedInRoom = makeFunction(
	async (users: AbacEvaluableUser[], _room: IRoom, _options?: FilterUsersAllowedInRoomOptions): Promise<AbacEvaluableUser[]> => users,
);

export const filterUsersAllowedInRoomOrThrow = makeFunction(
	async (users: AbacEvaluableUser[], _room: IRoom): Promise<AbacEvaluableUser[]> => users,
);
