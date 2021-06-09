import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';

const shownName = function(user) {
	if (!user) {
		return;
	}
	if (settings.get('UI_Use_Real_Name')) {
		return user.name;
	}
	return user.username;
};

const timeouts = {};
const timeout = 15000;
const renew = timeout / 3;
const renews = {};
const rooms = {};
const selfUploading = new ReactiveVar(false);
const usersUploading = new ReactiveDict();

const stopUploading = (rid) => Notifications.notifyRoom(rid, 'uploading', shownName(Meteor.user()), false);
const uploading = (rid) => Notifications.notifyRoom(rid, 'uploading', shownName(Meteor.user()), true);

export const MsgUploading = new class {
	constructor() {
		Tracker.autorun(() => Session.get('openedRoom') && this.addStream(Session.get('openedRoom')));
	}

	get selfUploading() { return selfUploading.get(); }

	cancel(rid) {
		if (rooms[rid]) {
			Notifications.unRoom(rid, 'uploading', rooms[rid]);
			Object.values(usersUploading.get(rid) || {}).forEach(clearTimeout);
			usersUploading.set(rid);
			delete rooms[rid];
		}
	}

	addStream(rid) {
		if (rooms[rid]) {
			return;
		}
		rooms[rid] = function(username, uploading) {
			const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username: 1 } });
			if (username === shownName(user)) {
				return;
			}
			const users = usersUploading.get(rid) || {};
			if (uploading) {
				clearTimeout(users[username]);
				users[username] = setTimeout(function() {
					const u = usersUploading.get(rid);
					delete u[username];
					usersUploading.set(rid, u);
				}, timeout);
			} else {
				clearTimeout(users[username]);
				delete users[username];
			}
			usersUploading.set(rid, users);
		};
		return Notifications.onRoom(rid, 'uploading', rooms[rid]);
	}

	stop(rid) {
		selfUploading.set(false);
		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeouts[rid];
			delete renews[rid];
		}
		return stopUploading(rid);
	}


	start(rid) {
		selfUploading.set(true);

		if (renews[rid]) {
			return;
		}

		renews[rid] = setTimeout(() => delete renews[rid], renew);

		uploading(rid);

		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
		}

		timeouts[rid] = setTimeout(() => this.stop(rid), timeout);

		return timeouts[rid];
	}


	get(rid) {
		return _.keys(usersUploading.get(rid)) || [];
	}
}();
