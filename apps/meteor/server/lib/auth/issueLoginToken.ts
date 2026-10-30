import { hashLoginToken } from '@rocket.chat/account-utils';
import { User } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

/** Starts a session for the user and returns its login token, usable to resume over DDP or as `X-Auth-Token`. */
export const issueLoginToken = async (userId: IUser['_id']): Promise<string> => {
	const token = Random.secret();

	await Users.addLoginToken(userId, { hashedToken: hashLoginToken(token), when: new Date() });
	await User.ensureLoginTokensLimit(userId);

	return token;
};
