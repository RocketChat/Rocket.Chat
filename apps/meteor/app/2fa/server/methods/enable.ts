import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:enable': () => Promise<{ secret: string; url: string }>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:enable'() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user');
		}

		// @ts-ignore
		return api.waitAndCall('user.generate2FASecret', [userId]);
	},
});
