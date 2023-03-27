import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../app/models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getTotalChannels(): number;
	}
}

Meteor.methods<ServerMethods>({
	getTotalChannels() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getTotalChannels',
			});
		}

		const query = {
			t: 'c',
		};
		return Rooms.find(query).count();
	},
});
