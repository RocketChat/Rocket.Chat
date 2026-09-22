import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const filterDefaultChannelsForUser = makeFunction(async (rooms: IRoom[], _user: IUser): Promise<IRoom[]> => rooms);
