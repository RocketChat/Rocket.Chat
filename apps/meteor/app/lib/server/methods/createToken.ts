import { MeteorError, User } from '@rocket.chat/core-services';
import { Accounts } from 'meteor/accounts-base';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createToken(userId: string): { userId: string; authToken: string };
	}
}

const { CREATE_TOKENS_FOR_USERS_SECRET } = process.env;

export async function generateAccessToken(userId: string, secret: string, callerId: string) {
	if (secret !== CREATE_TOKENS_FOR_USERS_SECRET) {
		throw new MeteorError('error-not-authorized', 'Not authorized');
	}

	if (callerId !== userId && !(await hasPermissionAsync(callerId, 'user-generate-access-token'))) {
		throw new MeteorError('error-not-authorized', 'Not authorized');
	}

	const token = Accounts._generateStampedLoginToken();
	Accounts._insertLoginToken(userId, token);

	await User.ensureLoginTokensLimit(userId);

	return {
		userId,
		authToken: token.token,
	};
}
