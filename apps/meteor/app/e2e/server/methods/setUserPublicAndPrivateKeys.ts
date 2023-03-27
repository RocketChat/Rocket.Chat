import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.setUserPublicAndPrivateKeys'({ public_key, private_key }: { public_key: string; private_key: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	'e2e.setUserPublicAndPrivateKeys'(keyPair) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.setUserPublicAndPrivateKeys',
			});
		}

		return Users.setE2EPublicAndPrivateKeysByUserId(userId, keyPair);
	},
});
