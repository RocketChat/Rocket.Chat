import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../server/lib/authorization/hasPermission';

export const removePersonalAccessTokenOfUser = async (tokenName: string, userId: string): Promise<void> => {
	if (!(await hasPermissionAsync(userId, 'create-personal-access-tokens'))) {
		throw new Meteor.Error('not-authorized', 'Not Authorized', {
			method: 'personalAccessTokens:removeToken',
		});
	}
	const tokenExist = await Users.findPersonalAccessTokenByTokenNameAndUserId({
		userId,
		tokenName,
	});
	if (!tokenExist) {
		throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', {
			method: 'personalAccessTokens:removeToken',
		});
	}
	await Users.removePersonalAccessTokenOfUser({
		userId,
		loginTokenObject: {
			type: 'personalAccessToken',
			name: tokenName,
		},
	});
};
