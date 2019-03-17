import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { RoomManager } from '../../app/ui-utils';

Meteor.startup(function() {
	Meteor.users.find({}, { fields: { name: 1, username: 1, pictures: 1, status: 1, statusMessage: 1, emails: 1, phone: 1, services: 1, utcOffset: 1 } }).observe({
		added(user) {
			Session.set(`user_${ user.username }_status`, user.status);
			Session.set(`user_${ user.username }_status_message`, user.statusMessage);
			RoomManager.updateUserStatus(user, user.status, user.utcOffset);
			RoomManager.updateUserStatusMessage(user, user.statusMessage);
		},
		changed(user) {
			Session.set(`user_${ user.username }_status`, user.status);
			Session.set(`user_${ user.username }_status_message`, user.statusMessage);
			RoomManager.updateUserStatus(user, user.status, user.utcOffset);
			RoomManager.updateUserStatusMessage(user, user.statusMessage);
		},
		removed(user) {
			Session.set(`user_${ user.username }_status`, null);
			RoomManager.updateUserStatus(user, 'offline', null);
		},
	});
});
