import { Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		roomNameExists(roomName: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async roomNameExists(roomName) {
		check(roomName, String);

		methodDeprecationLogger.method('roomNameExists', '7.0.0');

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		const room = await Rooms.findOneByName(roomName, { projection: { _id: 1 } });

		if (room === undefined || room === null) {
			return false;
		}

		return true;
	},
});
