import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { TOTP } from '../lib/totp';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:enable': () => Promise<{ secret: string; url: string }>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:enable'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = await Meteor.userAsync();

		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:enable',
			});
		}

		const hasUnverifiedEmail = user.emails?.some((email) => !email.verified);

		if (hasUnverifiedEmail) {
			throw new Meteor.Error('error-invalid-user', 'You need to verify your emails before setting up 2FA', {
				method: '2fa:enable',
			});
		}

		const secret = TOTP.generateSecret();

		await Users.disable2FAAndSetTempSecretByUserId(userId, secret.base32);

		return {
			secret: secret.base32,
			url: TOTP.generateOtpauthURL(secret, user.username),
		};
	},
});
