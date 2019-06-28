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
const selfTyping = new ReactiveVar(false);
const usersTyping = new ReactiveDict();

const stopTyping = (rid) => Notifications.notifyRoom(rid, 'typing', shownName(Meteor.user()), false);
const typing = (rid) => Notifications.notifyRoom(rid, 'typing', shownName(Meteor.user()), true);

export const MsgTyping = new class {
	constructor() {
		Tracker.autorun(() => Session.get('openedRoom') && this.addStream(Session.get('openedRoom')));
	}

	get selfTyping() { return selfTyping.get(); }

	cancel(rid) {
		if (rooms[rid]) {
			Notifications.unRoom(rid, 'typing', rooms[rid]);
			Object.values(usersTyping.get(rid) || {}).forEach(clearTimeout);
			usersTyping.set(rid);
			delete rooms[rid];
		}
	}

	addStream(rid) {
		if (rooms[rid]) {
			return;
		}
		rooms[rid] = function(username, typing) {
			const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username: 1 } });
			if (username === shownName(user)) {
				return;
			}
			const users = usersTyping.get(rid) || {};
			if (typing === true) {
				clearTimeout(users[username]);
				users[username] = setTimeout(function() {
					const u = usersTyping.get(rid);
					delete u[username];
					usersTyping.set(rid, u);
				}, timeout);
			} else {
				delete users[username];
			}

			usersTyping.set(rid, users);
		};
		return Notifications.onRoom(rid, 'typing', rooms[rid]);
	}

	stop(rid) {
		selfTyping.set(false);
		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
			delete timeouts[rid];
			delete renews[rid];
		}
		return stopTyping(rid);
	}


	start(rid) {
		selfTyping.set(true);

		if (renews[rid]) {
			return;
		}

		renews[rid] = setTimeout(() => delete renews[rid], renew);

		typing(rid);

		if (timeouts[rid]) {
			clearTimeout(timeouts[rid]);
		}

		timeouts[rid] = setTimeout(() => this.stop(rid), timeout);

		return timeouts[rid];
	}


	get(rid) {
		return _.keys(usersTyping.get(rid)) || [];
	}
}();
