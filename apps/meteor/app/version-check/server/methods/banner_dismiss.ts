import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'banner/dismiss'({ id }: { id: string }): Promise<void>;
	}
}

Meteor.methods({
	'banner/dismiss'({ id }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'banner/dismiss' });
		}

		Users.setBannerReadById(this.userId, id);
	},
});
