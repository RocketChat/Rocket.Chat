import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';

const timeout = 15000;
const renew = timeout / 3;
const rooms = {};

export const USER_RECORDING = 'user-recording';
export const USER_TYPING = 'user-typing';
export const USER_UPLOADING = 'user-uploading';

const recordingTimeouts = {};
const uploadingTimeouts = {};
const typingTimeouts = {};

const recordingRenews = {};
const uploadingRenews = {};
const typingRenews = {};

const recordingUsers = new ReactiveDict();
const uploadingUsers = new ReactiveDict();
const typingUsers = new ReactiveDict();

const selfActivity = { USER_RECORDING: false, USER_UPLOADING: false, USER_TYPING: false };

const shownName = function(user) {
	if (!user) {
		return;
	}
	if (settings.get('UI_Use_Real_Name')) {
		return user.name;
	}
	return user.username;
};

const stopActivity = (rid, activityType) => Notifications.notifyRoom(rid, 'user-activity', shownName(Meteor.user()), false, activityType);
const startActivity = (rid, activityType) => Notifications.notifyRoom(rid, 'user-activity', shownName(Meteor.user()), true, activityType);

function handleStreamAction(activity, performingUsers, rid, username) {
	const users = performingUsers.get(rid) || {};
	if (activity === true) {
		clearTimeout(users[username]);
		users[username] = setTimeout(function() {
			const u = performingUsers.get(rid);
			delete u[username];
			performingUsers.set(rid, u);
		}, timeout);
	} else {
		clearTimeout(users[username]);
		delete users[username];
	}
	performingUsers.set(rid, users);
}

export const UserAction = new class {
	constructor() {
		Tracker.autorun(() => Session.get('openedRoom') && this.addStream(Session.get('openedRoom')));
	}

	get selfActivity() { return selfActivity; }

	addStream(rid) {
		if (rooms[rid]) {
			return;
		}
		rooms[rid] = function(username, activity, activityType) {
			const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username: 1 } });
			if (username === shownName(user)) {
				return;
			}
			if (activityType === USER_RECORDING) {
				handleStreamAction(activity, recordingUsers, rid, username);
			} else if (activityType === USER_UPLOADING) {
				handleStreamAction(activity, uploadingUsers, rid, username);
			} else if (activityType === USER_TYPING) {
				handleStreamAction(activity, typingUsers, rid, username);
			}
		};
		return Notifications.onRoom(rid, 'user-activity', rooms[rid]);
	}

	startPerformingAction(rid, activityType, timeouts, renews) {
		if (renews[rid]) {
			return;
		}
		selfActivity[activityType] = true;

		renews[rid] = setTimeout(() => {
			clearTimeout(renews[rid]);
			delete renews[rid];
		}, renew);

		startActivity(rid, activityType);
		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeouts[rid];
		}

		timeouts[rid] = setTimeout(() => this.stop(rid), timeout);
		return timeouts[rid];
	}

	start(rid, activityType) {
		if (activityType === USER_RECORDING) {
			this.startPerformingAction(rid, USER_RECORDING, recordingTimeouts, recordingRenews);
		} else if (activityType === USER_TYPING) {
			this.startPerformingAction(rid, USER_TYPING, typingTimeouts, typingRenews);
		} else if (activityType === USER_UPLOADING) {
			this.startPerformingAction(rid, USER_UPLOADING, uploadingTimeouts, uploadingRenews);
		} else {
			// console.log('activity type is invalid');
		}
	}

	stopPerformingAction(rid, activityType, timeouts, renews) {
		selfActivity[activityType] = false;
		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeouts[rid];
		}
		if (renews[rid]) {
			clearTimeout(renews[rid]);
			delete renews[rid];
		}
		return stopActivity(rid, activityType);
	}

	stop(rid, activityType) {
		if (activityType === USER_RECORDING) {
			this.stopPerformingAction(rid, USER_RECORDING, recordingTimeouts, recordingRenews);
		} else if (activityType === USER_TYPING) {
			this.stopPerformingAction(rid, USER_TYPING, typingTimeouts, typingRenews);
		} else if (activityType === USER_UPLOADING) {
			this.stopPerformingAction(rid, USER_UPLOADING, uploadingTimeouts, uploadingRenews);
		} else {
			// console.log('not a valid activity type');
		}
	}

	cancel(rid) {
		if (!rooms[rid]) {
			return;
		}
		Notifications.unRoom(rid, 'user-activity', rooms[rid]);

		Object.values(typingUsers.get(rid) || {}).forEach(clearTimeout);
		Object.values(recordingUsers.get(rid) || {}).forEach(clearTimeout);
		Object.values(uploadingUsers.get(rid) || {}).forEach(clearTimeout);
		typingUsers.set(rid);
		recordingUsers.set(rid);
		uploadingUsers.set(rid);

		delete rooms[rid];
	}

	get(rid, activityType) {
		if (activityType === USER_RECORDING) {
			return _.keys(recordingUsers.get(rid)) || [];
		}
		if (activityType === USER_UPLOADING) {
			return _.keys(uploadingUsers.get(rid)) || [];
		}
		if (activityType === USER_TYPING) {
			return _.keys(typingUsers.get(rid)) || [];
		}
	}
}();
