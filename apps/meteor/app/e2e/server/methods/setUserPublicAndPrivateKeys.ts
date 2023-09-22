import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.setUserPublicAndPrivateKeys'({ public_key, private_key }: { public_key: string; private_key: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.setUserPublicAndPrivateKeys'(keyPair) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.setUserPublicAndPrivateKeys',
			});
		}

		await Users.setE2EPublicAndPrivateKeysByUserId(userId, {
			private_key: keyPair.private_key,
			public_key: keyPair.public_key,
		});
	},
});
