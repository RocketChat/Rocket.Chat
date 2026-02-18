import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';

declare module '@rocket.chat/ddp-client' {
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

		if (!userToken) {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', {
				method: '2fa:validateTempToken',
			});
		}

		return api.call('user.validateTempToken', [userId, userToken]);
	},
});