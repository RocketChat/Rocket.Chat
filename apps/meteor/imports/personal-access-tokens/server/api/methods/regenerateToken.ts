import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'personalAccessTokens:regenerateToken'(params: { tokenName: string }): Promise<string>;
	}
}

Meteor.methods<ServerMethods>({
	'personalAccessTokens:regenerateToken': twoFactorRequired(async function ({ tokenName }) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}
		if (!(await hasPermissionAsync(uid, 'create-personal-access-tokens'))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}

		const tokenExist = await Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: uid,
			tokenName,
		});
		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}

		await Meteor.callAsync('personalAccessTokens:removeToken', { tokenName });
		return Meteor.callAsync('personalAccessTokens:generateToken', {
			tokenName,
			bypassTwoFactor: tokenExist.bypassTwoFactor,
		});
	}),
});
