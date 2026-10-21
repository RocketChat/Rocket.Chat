import { ClientSafeError } from '@rocket.chat/core-services';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../server/lib/authorization/hasPermission';

export const generatePersonalAccessTokenOfUser = async ({
	bypassTwoFactor,
	tokenName,
	userId,
}: {
	tokenName: string;
	userId: string;
	bypassTwoFactor: boolean;
}): Promise<string> => {
	if (!(await hasPermissionAsync(userId, 'create-personal-access-tokens'))) {
		throw new ClientSafeError('not-authorized', 'Not Authorized', {
			method: 'personalAccessTokens:generateToken',
		});
	}

	const token = Random.secret();
	const tokenExist = await Users.findPersonalAccessTokenByTokenNameAndUserId({
		userId,
		tokenName,
	});
	if (tokenExist) {
		throw new ClientSafeError('error-token-already-exists', 'A token with this name already exists', {
			method: 'personalAccessTokens:generateToken',
		});
	}

	await Users.addPersonalAccessTokenToUser({
		userId,
		loginTokenObject: {
			hashedToken: Accounts._hashLoginToken(token),
			type: 'personalAccessToken',
			createdAt: new Date(),
			lastTokenPart: token.slice(-6),
			name: tokenName,
			bypassTwoFactor,
		},
	});
	return token;
};
