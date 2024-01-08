import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { TOTP } from '../lib/totp';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:validateTempToken': (userToken: string) => { codes: string[] } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:validateTempToken'(userToken) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = await Meteor.userAsync();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:validateTempToken',
			});
		}

		if (!user.services?.totp?.tempSecret) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = await TOTP.verify({
			secret: user.services.totp.tempSecret,
			token: userToken,
		});

		if (verified) {
			const { codes, hashedCodes } = TOTP.generateCodes();

			await Users.enable2FAAndSetSecretAndCodesByUserId(userId, user.services.totp.tempSecret, hashedCodes);
			return { codes };
		}
	},
});
