import _ from 'underscore';

export const MsgTyping = (function() {
	const timeout = 15000;
	const timeouts = {};
	let renew = true;
	const renewTimeout = 10000;
	const selfTyping = new ReactiveVar(false);
	const usersTyping = {};
	const dep = new Tracker.Dependency;

	const addStream = function(room) {
		if (!_.isEmpty(usersTyping[room] && usersTyping[room].users)) {
			return;
		}
		usersTyping[room] = { users: {} };
		return RocketChat.Notifications.onRoom(room, 'typing', function(username, typing) {
			const user = Meteor.user();
			if (username === (user && user.username)) {
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
		return RocketChat.Notifications.notifyRoom(room, 'typing', user && user.username, false);
	};
	const start = function(room) {
		if (!renew) { return; }

		setTimeout(() => renew = true, renewTimeout);

		renew = false;
		selfTyping.set(true);
		const user = Meteor.user();
		RocketChat.Notifications.notifyRoom(room, 'typing', user && user.username, true);
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

this.MsgTyping = MsgTyping;
