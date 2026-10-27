import { ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { isPersonalAccessToken } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../../server/lib/authorization/hasPermission';
import { removePersonalAccessTokenOfUser } from './removeToken';
import { generatePersonalAccessTokenOfUser } from './generateToken';

export const regeneratePersonalAccessTokenOfUser = async (tokenName: string, userId: string): Promise<string> => {
	if (!(await hasPermissionAsync(userId, 'create-personal-access-tokens'))) {
		throw new ClientSafeError('not-authorized', 'Not Authorized', {
			method: 'personalAccessTokens:regenerateToken',
		});
	}

	const tokenExist = await Users.findPersonalAccessTokenByTokenNameAndUserId({
		userId,
		tokenName,
	});
	if (!tokenExist) {
		throw new ClientSafeError('error-token-does-not-exists', 'Token does not exist', {
			method: 'personalAccessTokens:regenerateToken',
		});
	}

	await removePersonalAccessTokenOfUser(tokenName, userId);

	const tokenObject = tokenExist.services?.resume?.loginTokens?.find((token) => isPersonalAccessToken(token) && token.name === tokenName);

	return generatePersonalAccessTokenOfUser({
		tokenName,
		userId,
		bypassTwoFactor: (tokenObject && isPersonalAccessToken(tokenObject) && tokenObject.bypassTwoFactor) || false,
	});
};
