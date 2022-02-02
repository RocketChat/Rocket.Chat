import { Meteor } from 'meteor/meteor';

import notifications from '../../../notifications/server/lib/Notifications';

Meteor.methods({
	updateOTRAck({ message, ack }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOTRAck' });
		}
		const otrStreamer = notifications.streamRoomMessage;
		message.otrAck = ack;
		otrStreamer.emit(message.rid, message);
	},
});
