import type { IUser } from '@rocket.chat/core-typings';

export type UserMention = Pick<IUser, '_id' | 'name' | 'username'>;
