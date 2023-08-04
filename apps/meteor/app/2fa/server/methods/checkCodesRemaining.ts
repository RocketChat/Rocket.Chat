import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:checkCodesRemaining': () => { remaining: number };
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:checkCodesRemaining'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:checkCodesRemaining',
			});
		}

		if (!user.services?.totp?.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		return {
			remaining: user.services.totp.hashedBackup.length,
		};
	},
});
