import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';
import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'personalAccessTokens:regenerateToken'(params: { tokenName: string }): Promise<string>;
	}
}

Meteor.methods<ServerMethods>({
	'personalAccessTokens:regenerateToken': twoFactorRequired(async ({ tokenName }) => {
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
