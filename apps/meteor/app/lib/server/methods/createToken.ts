import { User } from '@rocket.chat/core-services';
import { Accounts } from 'meteor/accounts-base';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function generateAccessToken(callee: string, userId: string) {
	if (
		!['yes', 'true'].includes(String(process.env.CREATE_TOKENS_FOR_USERS)) ||
		(callee !== userId && !(await hasPermissionAsync(callee, 'user-generate-access-token')))
	) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized');
	}

	const token = Accounts._generateStampedLoginToken();
	Accounts._insertLoginToken(userId, token);

	await User.ensureLoginTokensLimit(userId);

	return {
		userId,
		authToken: token.token,
	};
}
