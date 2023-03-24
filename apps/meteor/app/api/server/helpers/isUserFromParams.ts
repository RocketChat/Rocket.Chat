import type { IUser } from '@rocket.chat/core-typings';

export function isUserFromParams(
	params: { userId?: string; username?: string; user?: string },
	loggedInUserId?: string,
	loggedInUser?: IUser,
): boolean {
	return Boolean(
		(!params.userId && !params.username && !params.user) ||
			(params.userId && loggedInUserId === params.userId) ||
			(params.username && loggedInUser?.username === params.username) ||
			(params.user && loggedInUser?.username === params.user),
	);
}
