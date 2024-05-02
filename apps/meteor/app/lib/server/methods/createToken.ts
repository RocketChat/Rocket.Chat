import { User } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createToken(userId: string): { userId: string; authToken: string };
	}
}

export async function generateAccessToken(callee: string, userId: string) {
	if (
		!['yes', 'true'].includes(String(process.env.CREATE_TOKENS_FOR_USERS)) ||
		(callee !== userId && !(await hasPermissionAsync(callee, 'user-generate-access-token')))
	) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'createToken' });
	}

	const token = Accounts._generateStampedLoginToken();
	Accounts._insertLoginToken(userId, token);

	await User.ensureLoginTokensLimit(userId);

	return {
		userId,
		authToken: token.token,
	};
}

Meteor.methods<ServerMethods>({
	async createToken(userId) {
		methodDeprecationLogger.method('createToken', '8.0.0');

		const callee = Meteor.userId();
		if (!callee) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createToken' });
		}

		return generateAccessToken(callee, userId);
	},
});
