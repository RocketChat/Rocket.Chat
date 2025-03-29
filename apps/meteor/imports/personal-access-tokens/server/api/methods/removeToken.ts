import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'personalAccessTokens:removeToken'(params: { tokenName: string }): Promise<void>;
	}
}

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
}

Meteor.methods<ServerMethods>({
	'personalAccessTokens:removeToken': twoFactorRequired(async function ({ tokenName }) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:removeToken',
			});
		}

		return removePersonalAccessTokenOfUser(tokenName, uid);
	}),
});
