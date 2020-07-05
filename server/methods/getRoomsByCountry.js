import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Country, Rooms } from '../../app/models';

Meteor.methods({
	getRoomsByCountry(name) {
		check(name, String);
		const rooms = [];
		const roomsNames = Country.findCountry(name).fetch()[0].roomName;
		for (let index = 0; index < roomsNames.length; index++) {
			const c = Rooms.find({ name: roomsNames[index] });
			rooms.push(c.fetch()[0]);
		}
		return rooms;
	},
});
