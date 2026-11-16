import type { IMessage } from '@rocket.chat/core-typings';

import { normalizeUsername } from './normalizeUsername';

/**
 * Whether `@username` is shown next to an author's name: only when usernames are not hidden, real names are on and the
 * name shown says something the username does not.
 */
export const getAuthorUsername = (
	{ name, username }: Pick<IMessage['u'], 'name' | 'username'>,
	{ showUsername, showRealName }: { showUsername: boolean; showRealName: boolean },
) => {
	const normalizedUsername = normalizeUsername(username);
	const nameRepeatsUsername = !name || normalizeUsername(name) === normalizedUsername;

	return { normalizedUsername, showUsername: showUsername && showRealName && !nameRepeatsUsername };
};
