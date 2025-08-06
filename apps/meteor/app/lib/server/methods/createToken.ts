import { MeteorError, User } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createToken(userId: string): { userId: string; authToken: string };
	}
}

const { CREATE_TOKENS_FOR_USERS_SECRET } = process.env;

export async function generateAccessToken(userId: string, secret: string) {
	if (secret !== CREATE_TOKENS_FOR_USERS_SECRET) {
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

Meteor.methods<ServerMethods>({
	async createToken(userId) {
		methodDeprecationLogger.method('createToken', '8.0.0', 'Use REST endpoint `/v1/users.createToken` instead');

		const callee = Meteor.userId();
		if (!callee) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createToken' });
		}

		return generateAccessToken(callee, userId);
	},
});
