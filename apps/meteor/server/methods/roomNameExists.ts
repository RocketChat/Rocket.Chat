import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Rooms } from '../../app/models/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		roomNameExists(roomName: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	roomNameExists(roomName) {
		check(roomName, String);

		methodDeprecationLogger.warn('roomNameExists will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		const room = Rooms.findOneByName(roomName);

		if (room === undefined || room === null) {
			return false;
		}

		return true;
	},
});
