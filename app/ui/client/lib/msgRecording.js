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
const selfRecording = new ReactiveVar(false);
const userRecording = new ReactiveDict();

const stopRecording = (rid) => Notifications.notifyRoom(rid, 'recording', shownName(Meteor.user()), false);
const recording = (rid) => Notifications.notifyRoom(rid, 'recording', shownName(Meteor.user()), true);

export const MsgRecording = new class {
	constructor() {
		Tracker.autorun(() => Session.get('openedRoom') && this.addStream(Session.get('openedRoom')));
	}

	get selfRecording() { return selfRecording.get(); }

	cancel(rid) {
		if (rooms[rid]) {
			Notifications.unRoom(rid, 'recording', rooms[rid]);
			Object.values(userRecording.get(rid) || {}).forEach(clearTimeout);
			userRecording.set(rid);
			delete rooms[rid];
		}
	}

	addStream(rid) {
		if (rooms[rid]) {
			return;
		}
		rooms[rid] = function(username, recording) {
			const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username: 1 } });
			if (username === shownName(user)) {
				return;
			}
			const users = userRecording.get(rid) || {};
			if (recording) {
				clearTimeout(users[username]);
				users[username] = setTimeout(function() {
					const u = userRecording.get(rid);
					delete u[username];
					userRecording.set(rid, u);
				}, timeout);
			} else {
				clearTimeout(users[username]);
				delete users[username];
			}
			userRecording.set(rid, users);
		};
		return Notifications.onRoom(rid, 'recording', rooms[rid]);
	}

	start(rid) {
		if (renews[rid]) {
			return;
		}
		selfRecording.set(true);

		renews[rid] = setTimeout(() => {
			delete renews[rid];
		}, renew);

		recording(rid);

		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeout[rid];
		}

		timeouts[rid] = setTimeout(() => this.stop(rid), timeout);
		return timeouts[rid];
	}

	stop(rid) {
		selfRecording.set(false);
		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeouts[rid];
		}
		return stopRecording(rid);
	}

	get(rid) {
		return _.keys(userRecording.get(rid)) || [];
	}
}();
