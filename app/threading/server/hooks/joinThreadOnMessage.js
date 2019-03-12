import { Meteor } from 'meteor/meteor';
import { callbacks } from '/app/callbacks';
import { Subscriptions } from '/app/models';

callbacks.add('beforeSaveMessage', (message, room) => {

	// abort if room is not a thread
	if (!room || !room.prid) {
		return message;
	}

	// check if user already joined the thread
	const sub = Subscriptions.findOneByRoomIdAndUserId(room._id, message.u._id, { fields: { _id: 1 } });
	if (sub) {
		return message;
	}

	// if no subcription, call join
	Meteor.runAsUser(message.u._id, () => Meteor.call('joinRoom', room._id));

	return message;
});
