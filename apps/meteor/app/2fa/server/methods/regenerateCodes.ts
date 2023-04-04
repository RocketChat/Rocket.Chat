import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Users } from '../../../models/server';
import { TOTP } from '../lib/totp';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:regenerateCodes': (userToken: string) => { codes: string[] } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	'2fa:regenerateCodes'(userToken) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:regenerateCodes',
			});
		}

		if (!user.services?.totp?.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = TOTP.verify({
			secret: user.services.totp.secret,
			token: userToken,
			userId,
			backupTokens: user.services.totp.hashedBackup,
		});

		if (verified) {
			const { codes, hashedCodes } = TOTP.generateCodes();

			Users.update2FABackupCodesByUserId(Meteor.userId(), hashedCodes);
			return { codes };
		}
	},
});
