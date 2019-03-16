import { Meteor } from 'meteor/meteor';
import { callbacks } from '../../../callbacks';
import { Subscriptions } from '../../../models';

callbacks.add('beforeSaveMessage', (message, room) => {

	if (!room) {
		return message;
	}

	// check if user already joined
	const sub = Subscriptions.findOneByRoomIdAndUserId(room._id, message.u._id, { fields: { _id: 1 } });
	if (sub) {
		return message;
	}

	// if no subcription, call join
	Meteor.runAsUser(message.u._id, () => Meteor.call('joinRoom', room._id));

	return message;
});
