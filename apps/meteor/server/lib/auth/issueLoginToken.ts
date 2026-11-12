import { generateStampedLoginToken, hashStampedToken } from '@rocket.chat/account-utils';
import type { StampedLoginToken } from '@rocket.chat/account-utils';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function issueLoginToken(userId: IUser['_id']): Promise<StampedLoginToken> {
	const stampedToken = generateStampedLoginToken();
	await Users.addLoginToken(userId, hashStampedToken(stampedToken));

	return stampedToken;
}
