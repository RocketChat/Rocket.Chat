import type { IUser } from '@rocket.chat/core-typings';

export const getUserDisplayName = (name: IUser['name'], username: IUser['username'], useRealName: boolean): string | undefined =>
	useRealName ? name || username : username;
