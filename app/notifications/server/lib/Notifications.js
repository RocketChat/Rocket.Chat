import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

import { loginStream } from '../../../../../../../app/lib/server/lib/loginStream';
import { publishToRedis } from '../../../../../../../app/redis/redisPublisher';
import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { WEB_RTC_EVENTS } from '../../../webrtc';

const changedPayload = function(collection, id, fields) {
	return DDPCommon.stringifyDDP({
		msg: 'changed',
		collection,
		id,
		fields,
	});
};
const send = function(self, msg) {
	if (!self.socket) {
		return;
	}
	self.socket.send(msg);
};
class RoomStreamer extends Meteor.Streamer {
	_publish(publication, eventName, options) {
		super._publish(publication, eventName, options);
		const uid = Meteor.userId();
		if (/rooms-changed/.test(eventName)) {
			const roomEvent = (...args) => send(publication._session, changedPayload(this.subscriptionName, 'id', {
				eventName: `${ uid }/rooms-changed`,
				args,
			}));
			const rooms = Subscriptions.find({ 'u._id': uid }, { fields: { rid: 1 } }).fetch();
			rooms.forEach(({ rid }) => {
				this.on(rid, roomEvent);
			});

			const userEvent = (clientAction, { rid }) => {
				switch (clientAction) {
					case 'inserted':
						rooms.push({ rid });
						this.on(rid, roomEvent);

						// after a subscription is added need to emit the room again
						roomEvent('inserted', Rooms.findOneById(rid));
						break;

					case 'removed':
						this.removeListener(rid, roomEvent);
						break;
				}
			};
			this.on(uid, userEvent);

			publication.onStop(() => {
				this.removeListener(uid, userEvent);
				rooms.forEach(({ rid }) => this.removeListener(rid, roomEvent));
			});
		}
	}
}

class Notifications {
	constructor() {
		const self = this;
		this.debug = false;
		this.notifyUser = this.notifyUser.bind(this);
		this.streamAll = new Meteor.Streamer('notify-all');
		this.streamLogged = new Meteor.Streamer('notify-logged');
		this.streamRoom = new Meteor.Streamer('notify-room');
		this.streamBind = loginStream;
		this.streamUser = new RoomStreamer('notify-user');
		this.streamAll.allowWrite('none');
		this.streamLogged.allowWrite('none');
		this.streamRoom.allowWrite('none');
		this.streamUser.allowWrite('logged');
		this.streamAll.allowRead('all');
		this.streamLogged.allowRead('logged');
		this.streamRoom.allowRead(function(eventName, extraData) {
			const [roomId] = eventName.split('/');
			const room = Rooms.findOneById(roomId);
			if (!room) {
				console.warn(`Invalid streamRoom eventName: "${ eventName }"`);
				return false;
			}
			if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
				return true;
			}
			if (this.userId == null) {
				return false;
			}
			const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { fields: { _id: 1 } });
			return subscription != null;
		});
		this.streamUser.allowRead(function(eventName) {
			const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});
	}

	notifyAll(eventName, value) {
		if (settings.get('Troubleshoot_Disable_Instance_Broadcast')) { return; }
		if (this.debug === true) {
			console.log('notifyAll', [eventName, data]);
		}

		const body = {
			ns: 'broadcast',
			funcName: 'notifyAllInThisInstance',
			eventName,
			value,
		};

		return publishToRedis('broadcast', body);
	}

	notifyLogged(eventName, value) {
		if (settings.get('Troubleshoot_Disable_Instance_Broadcast')) { return; }
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, data]);
		}
		const body = {
			ns: 'broadcast',
			funcName: 'notifyLoggedInThisInstance',
			eventName,
			value,
		};

		return publishToRedis('broadcast', body);
	}

	notifyRoom(room, eventName, value) {
		if (settings.get('Troubleshoot_Disable_Instance_Broadcast')) { return; }
		if (this.debug === true) {
			console.log('notifyRoom', [room, eventName, data]);
		}
		const body = {
			funcName: 'notifyRoomInThisInstance',
			ns: 'broadcast',
			key: room,
			eventName,
			value,
		};

		if (room.length === 17) {
			publishToRedis(`room-${ room }`, body);
		} else {
			const userIds = [room.slice(0, 17), room.slice(17)];
			userIds.forEach((userId) => {
				publishToRedis(`user-${ userId }`, body);
			});
		}
	}

	notifyUser(userId, eventName, value) {
		if (settings.get('Troubleshoot_Disable_Instance_Broadcast')) { return; }
		if (this.debug === true) {
			console.log('notifyUser', [userId, eventName, data]);
		}
		const body = {
			ns: 'broadcast',
			key: userId,
			funcName: 'notifyUserInThisInstance',
			eventName,
			value,
		};
		return publishToRedis(`user-${ userId }`, body);
	}

	notifyAllInThisInstance(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyAll', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamAll.emitWithoutBroadcast.apply(this.streamAll, args);
	}

	notifyLoggedInThisInstance(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamLogged.emitWithoutBroadcast.apply(this.streamLogged, args);
	}

	notifyRoomInThisInstance(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyRoomAndBroadcast', [room, eventName, ...args]);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emitWithoutBroadcast.apply(this.streamRoom, args);
	}

	notifyUserInThisInstance(userId, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyUserAndBroadcast', [userId, eventName, ...args]);
		}
		args.unshift(`${ userId }/${ eventName }`);
		return this.streamUser.emitWithoutBroadcast.apply(this.streamUser, args);
	}

	pubsubAdapter(key, eventName, funcName, value) {
		if (this[funcName]) {
			if (key) {
				return this[funcName](key, eventName, value);
			}

			return this[funcName](eventName, value);
		}
	}
}

const notifications = new Notifications();

notifications.streamRoom.allowWrite(function(eventName, { username, typing, extraData }) {
	const [roomId, e] = eventName.split('/');

	if (isNaN(e) ? e === WEB_RTC_EVENTS.WEB_RTC : parseFloat(e) === WEB_RTC_EVENTS.WEB_RTC) {
		return notifications.notifyRoom(roomId, 'typing', { username, typing, extraData });
	}

	if (e === 'typing') {
		const key = settings.get('UI_Use_Real_Name') ? 'name' : 'username';
		// typing from livechat widget
		if (extraData && extraData.token) {
			const room = Rooms.findOneById(roomId);
			if (room && room.t === 'l' && room.v.token === extraData.token) {
				return notifications.notifyRoom(roomId, 'typing', { username, typing, extraData });
			}
		}

		const user = Meteor.users.findOne(this.userId, {
			fields: {
				[key]: 1,
			},
		});

		if (!user) {
			return false;
		}

		if (user[key] === username) {
			return notifications.notifyRoom(roomId, 'typing', { username, typing, extraData });
		}
	}
	return false;
});

export default notifications;
