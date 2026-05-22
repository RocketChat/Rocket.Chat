import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
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

		return Rooms.countDocuments({ t: 'c' });
	},
});
