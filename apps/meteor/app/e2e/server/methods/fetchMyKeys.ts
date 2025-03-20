import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.fetchMyKeys'(): { public_key?: string; private_key?: string };
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.fetchMyKeys'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.fetchMyKeys' });
		}
		return Users.fetchKeysByUserId(userId);
	},
});
