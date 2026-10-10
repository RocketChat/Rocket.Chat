import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export type FilterDefaultChannelsOptions = { refreshUserAttributes?: boolean };

export const filterDefaultChannelsForUser = makeFunction(
	async (rooms: IRoom[], _user: IUser, _options?: FilterDefaultChannelsOptions): Promise<IRoom[]> => rooms,
);
