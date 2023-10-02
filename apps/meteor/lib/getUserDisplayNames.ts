import type { IUser } from '@rocket.chat/core-typings';
/*
    In contrary to getUserDisplayName, this function returns an array of strings, containing name & username in the order they're supposed to be displayed.
*/
export const getUserDisplayNames = (
	name: IUser['name'],
	username: IUser['username'],
	useRealName: boolean,
): [nameOrUsername: string, username?: string] => {
	if (!username) {
		throw new Error('Username is required');
	}
	const shouldUseName = !!(useRealName && name);

	return shouldUseName ? [name, username] : [username];
};
