import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Country, Rooms } from '../../app/models';

Meteor.methods({
	getRoomsByCountry(name) {
		check(name, String);
		this.listNames = Country.findCountry(name).fetch().roomName | [];
		this.rooms = [];
		this.listNames.foreach((element) => {
			this.rooms.push(Rooms.findOne({ name: element }).fetch());
		});
		return this.rooms;
	},
});
