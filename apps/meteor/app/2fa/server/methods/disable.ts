import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:disable': (code: string) => Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:disable'(code) {
		if (!code) {
			throw new Meteor.Error('error-invalid-code', 'Invalid code', {
				method: '2fa:disable',
			});
		}

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		return api.call('user.disable2FA', [userId, code]);
	},
});
