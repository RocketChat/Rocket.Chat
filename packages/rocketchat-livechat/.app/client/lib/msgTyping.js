/* globals Notifications, Livechat */
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import visitor from '../../imports/client/visitor';
import _ from 'underscore';

export const MsgTyping = (function() {
	const timeout = 15000;
	const timeouts = {};
	let renew = true;
	const renewTimeout = 10000;
	const selfTyping = new ReactiveVar(false);
	const usersTyping = {};
	const dep = new Tracker.Dependency;
	let oldRoom;

	const addStream = function(room) {
		if (!_.isEmpty(usersTyping[room] && usersTyping[room].users)) {
			return;
		}
		usersTyping[room] = { users: {} };
		return Notifications.onRoom(room, 'typing', function(username, typing/* , extraData*/) {
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

	Tracker.autorun(() => {
		if (Livechat.room && visitor.getId()) {
			if (oldRoom) {
				Notifications.unRoom(oldRoom, 'typing');
			}
			addStream(Livechat.room);
			oldRoom = Livechat.room;
		}
	});

	const stop = function(room) {
		renew = true;
		selfTyping.set(false);
		if (timeouts && timeouts[room]) {
			clearTimeout(timeouts[room]);
			timeouts[room] = null;
		}
		const visitorData = visitor.getData();
		return Notifications.notifyRoom(room, 'typing', visitorData && visitorData.username, false, { token: visitor.getToken() });
	};
	const start = function(room) {
		if (!renew) { return; }

		setTimeout(() => { renew = true; }, renewTimeout);

		renew = false;
		selfTyping.set(true);
		const visitorData = visitor.getData();
		Notifications.notifyRoom(room, 'typing', visitorData && visitorData.username, true, { token: visitor.getToken() });
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

this.MsgTyping = MsgTyping;
