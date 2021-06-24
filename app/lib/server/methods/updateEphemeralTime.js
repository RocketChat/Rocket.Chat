import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import moment from 'moment';

import { Rooms } from '../../../models';

Meteor.methods({
	updateEphemeralRoom(rid, newEphemeralTime) {
		check(rid, String);
		const room = Rooms.findOneById(rid);
		console.log(room);
		switch (newEphemeralTime) {
			case '1hr':
				newEphemeralTime = moment().add(5, 'minutes').toDate();
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
		Rooms.setEphemeralTime(rid, newEphemeralTime);
		return true;
	},
});
