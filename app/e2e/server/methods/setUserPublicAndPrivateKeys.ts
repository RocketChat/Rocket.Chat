import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';

Meteor.methods({
	// eslint-disable-next-line @typescript-eslint/camelcase
	'e2e.setUserPublicAndPrivateKeys'({ public_key, private_key }: { public_key: any; private_key: any}) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.setUserPublicAndPrivateKeys' });
		}

		// eslint-disable-next-line @typescript-eslint/camelcase
		return Users.setE2EPublicAndPrivateKeysByUserId(userId, { public_key, private_key });
	},
});
