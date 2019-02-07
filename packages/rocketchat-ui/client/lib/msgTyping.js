import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { settings } from 'meteor/rocketchat:settings';
import { Notifications } from 'meteor/rocketchat:notifications';
import _ from 'underscore';

export const MsgTyping = (function() {
	const timeout = 15000;
	const timeouts = {};
	let renew = true;
	const renewTimeout = 10000;
	const selfTyping = new ReactiveVar(false);
	const usersTyping = {};
	const dep = new Tracker.Dependency;
	let disableUserTyping = undefined;
	Tracker.autorun(function() {
		if (!Meteor.userId()) {
			return;
		}
		disableUserTyping = RocketChat.getUserPreference(Meteor.userId(), 'disableUserTyping');
	});

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
		if (disableUserTyping === true) {
			RocketChat.Notifications.unRoom(room, 'typing', function() { return; });
			return;
		}
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
		if (disableUserTyping === true) {
			return;
		}

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
		if (disableUserTyping === true) {
			return;
		}
		if (!renew) { return; }

		setTimeout(() => renew = true, renewTimeout);

		renew = false;
		selfTyping.set(true);
		const user = Meteor.user();
		Notifications.notifyRoom(room, 'typing', shownName(user), true);
		clearTimeout(timeouts[room]);
		return timeouts[room] = Meteor.setTimeout(() => stop(room), timeout);
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
