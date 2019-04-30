import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';

export const MsgTyping = (function() {
	const timeout = 15000;
	const timeouts = {};
	let renew = true;
	const renewTimeout = 10000;
	const selfTyping = new ReactiveVar(false);
	const usersTyping = {};
	const dep = new Tracker.Dependency;

	const shownName = function(user) {
		if (!user) {
			return;
		}
		if (settings.get('UI_Use_Real_Name')) {
			return user.name;
		}
		return user.username;
	};

	const addStream = function(room) {
		if (!_.isEmpty(usersTyping[room] && usersTyping[room].users)) {
			return;
		}
		usersTyping[room] = { users: {} };
		return Notifications.onRoom(room, 'typing', function(username, typing) {
			const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username: 1 } });
			if (username === shownName(user)) {
				return;
			}
			const { users } = usersTyping[room];
			if (typing === true) {
				users[username] = Meteor.setTimeout(function() {
					delete users[username];
					usersTyping[room].users = users;
					return dep.changed();
				}, timeout);
			} else {
				delete users[username];
			}
			usersTyping[room].users = users;
			return dep.changed();
		});
	};

	Tracker.autorun(() => Session.get('openedRoom') && addStream(Session.get('openedRoom')));
	const stop = function(room) {
		renew = true;
		selfTyping.set(false);
		if (timeouts && timeouts[room]) {
			clearTimeout(timeouts[room]);
			timeouts[room] = null;
		}
		const user = Meteor.user();
		return Notifications.notifyRoom(room, 'typing', shownName(user), false);
	};
	const start = function(room) {
		if (!renew) { return; }

		setTimeout(() => { renew = true; }, renewTimeout);

		renew = false;
		selfTyping.set(true);
		const user = Meteor.user();
		Notifications.notifyRoom(room, 'typing', shownName(user), true);
		clearTimeout(timeouts[room]);
		timeouts[room] = Meteor.setTimeout(() => stop(room), timeout);
		return timeouts[room];
	};


	const get = function(room) {
		dep.depend();
		if (!usersTyping[room]) {
			usersTyping[room] = { users: {} };
		}
		const { users } = usersTyping[room];
		return _.keys(users) || [];
	};

	return { start, stop, get, selfTyping };
}());
