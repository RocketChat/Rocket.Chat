import { Meteor } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';

import { WEB_RTC_EVENTS } from '../../../webrtc';
import { Subscriptions, Rooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { NotificationsModule } from '../../../../server/modules/notifications/notifications.module';
import { hasPermission } from '../../../authorization/client';

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

class MessageStream extends Meteor.Streamer {
	getSubscriptionByUserIdAndRoomId(userId, rid) {
		return this.subscriptions.find((sub) => sub.eventName === rid && sub.subscription.userId === userId);
	}

	_publish(publication, eventName, options) {
		super._publish(publication, eventName, options);
		const uid = Meteor.userId();

		const userEvent = (clientAction, { rid }) => {
			switch (clientAction) {
				case 'removed':
					this.removeListener(uid, userEvent);
					this.removeSubscription(this.getSubscriptionByUserIdAndRoomId(uid, rid), eventName);
					break;
			}
		};
		this.on(uid, userEvent);
	}

	mymessage = (eventName, args) => {
		const subscriptions = this.subscriptionsByEventName[eventName];
		if (!Array.isArray(subscriptions)) {
			return;
		}
		subscriptions.forEach(({ subscription }) => {
			const options = this.isEmitAllowed(subscription, eventName, args);
			if (options) {
				send(subscription._session, changedPayload(this.subscriptionName, 'id', {
					eventName,
					args: [args, options],
				}));
			}
		});
	}
}

class Notifications extends NotificationsModule {
	constructor(Streamer, RoomStreamer, MessageStream) {
		super(Streamer, RoomStreamer, MessageStream);

		const self = this;
		this.streamRoomUsers.allowWrite(function(eventName, ...args) {
			const [roomId, e] = eventName.split('/');
			// const user = Meteor.users.findOne(this.userId, {
			// 	fields: {
			// 		username: 1
			// 	}
			// });
			if (Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
				const subscriptions = Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
				subscriptions.forEach((subscription) => self.notifyUser(subscription.u._id, e, ...args));
			}
			return false;
		});

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
	}
}

const notifications = new Notifications(Meteor.Streamer, RoomStreamer, MessageStream);

notifications.streamRoom.allowWrite(function(eventName, username, typing, extraData) {
	const [roomId, e] = eventName.split('/');

	if (isNaN(e) ? e === WEB_RTC_EVENTS.WEB_RTC : parseFloat(e) === WEB_RTC_EVENTS.WEB_RTC) {
		return true;
	}

	if (e === 'typing') {
		const key = settings.get('UI_Use_Real_Name') ? 'name' : 'username';
		// typing from livechat widget
		if (extraData && extraData.token) {
			const room = Rooms.findOneById(roomId);
			if (room && room.t === 'l' && room.v.token === extraData.token) {
				return true;
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

		return user[key] === username;
	}
	return false;
});

export default notifications;


notifications.streamRoomMessage.allowRead(function(eventName, args) {
	try {
		const room = Meteor.call('canAccessRoom', eventName, this.userId, args);

		if (!room) {
			return false;
		}

		if (room.t === 'c' && !hasPermission(this.userId, 'preview-c-room') && !Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } })) {
			return false;
		}

		return true;
	} catch (error) {
		/* error*/
		return false;
	}
});

notifications.streamRoomMessage.allowRead('__my_messages__', 'all');

notifications.streamRoomMessage.allowEmit('__my_messages__', function(eventName, msg) {
	try {
		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

		if (!room) {
			return false;
		}

		return {
			roomParticipant: Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null,
			roomType: room.t,
			roomName: room.name,
		};
	} catch (error) {
		/* error*/
		return false;
	}
});
