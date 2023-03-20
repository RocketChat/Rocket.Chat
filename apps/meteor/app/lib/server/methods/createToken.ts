import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermission } from '../../../authorization/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createToken(userId: string): { userId: string; authToken: string };
	}
}

Meteor.methods<ServerMethods>({
	createToken(userId) {
		const uid = Meteor.userId();

		if (
			!['yes', 'true'].includes(String(process.env.CREATE_TOKENS_FOR_USERS)) ||
			!uid ||
			(uid !== userId && !hasPermission(uid, 'user-generate-access-token'))
		) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'createToken' });
		}
		const token = Accounts._generateStampedLoginToken();
		Accounts._insertLoginToken(userId, token);
		return {
			userId,
			authToken: token.token,
		};
	},
});
