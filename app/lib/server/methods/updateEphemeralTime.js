import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import moment from 'moment';

import { Rooms, Messages, Subscriptions } from '../../../models';

Meteor.methods({
	updateEphemeralRoom(rid, newEphemeralTime) {
		check(rid, String);
		const room = Rooms.findOneById(rid);
		const user = Meteor.user();

		console.log(room);
		switch (newEphemeralTime) {
			case '5mins':
				newEphemeralTime = moment().add(5, 'minutes').toDate();
				break;
			case '15mins':
				newEphemeralTime = moment().add(15, 'minutes').toDate();
				break;
			case '1hr':
				newEphemeralTime = moment().add(1, 'hour').toDate();
				break;
			case '6hr':
				newEphemeralTime = moment().add(6, 'hour').toDate();
				break;
			case '12hr':
				newEphemeralTime = moment().add(12, 'hour').toDate();
				break;
			case '24hr':
				newEphemeralTime = moment().add(24, 'hour').toDate();
				break;
		}
		const updated = Rooms.setEphemeralTime(rid, newEphemeralTime);
		const messages = Messages.setEphemeralTime(rid, newEphemeralTime);
		const subscriptions = Subscriptions.setEphemeralTime(rid, newEphemeralTime);
		if (updated && messages && subscriptions) {
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_ephemeral_time', rid, newEphemeralTime, user);
		}

		return true;
	},
});
