import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom } from '../../app/models/client';

Meteor.startup(() => {
	ChatRoom.find().observe({
		added(data) {
			Session.set(`roomData${data._id}`, data);
		},
		changed(data) {
			Session.set(`roomData${data._id}`, data);
		},
		removed(data) {
			Session.set(`roomData${data._id}`, undefined);
		},
	});
});
