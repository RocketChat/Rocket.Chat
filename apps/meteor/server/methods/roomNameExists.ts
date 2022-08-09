import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../app/models/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	roomNameExists(roomName) {
		check(roomName, String);
		console.log(`consegui obter o roomName no Meteor Method: ${roomName}`);

		methodDeprecationLogger.warn('roomNameExists will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		const room = Rooms.findOneByName(roomName);

		console.log(`Esse é o room no Meteor Method: ${room}`);

		let result = true;

		if (room === undefined || room === null) {
			result = false;
		}

		console.log(`Esse é o result no Meteor Method: ${result}`);

		return result;
		// return !!room;
	},
});
