import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { DDPCommon } from 'meteor/ddp-common';

import { WEB_RTC_EVENTS } from '../../../webrtc';
import { Subscriptions, Rooms, LivechatRooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { NotificationsModule } from '../../../../server/modules/notifications/notifications.module';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization/server';
import { Streamer, Publication, DDPSubscription } from '../../../../server/modules/streamer/streamer.module';
import { ISubscription } from '../../../../definition/ISubscription';
import { IUser } from '../../../../definition/IUser';
import { roomTypes } from '../../../utils/server';

export class Stream extends Streamer {
	registerPublication(name: string, fn: (eventName: string, options: boolean | {useCollection?: boolean; args?: any}) => void): void {
		Meteor.publish(name, function(eventName, options) {
			return Promise.await(fn.call(this, eventName, options));
		});
	}

	registerMethod(methods: Record<string, (eventName: string, ...args: any[]) => any>): void {
		Meteor.methods(methods);
	}

	changedPayload(collection: string, id: string, fields: Record<string, any>): string | false {
		return DDPCommon.stringifyDDP({
			msg: 'changed',
			collection,
			id,
			fields,
		});
	}
}

class RoomStreamer extends Stream {
	async _publish(publication: Publication, eventName: string, options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		await super._publish(publication, eventName, options);
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		if (/rooms-changed/.test(eventName)) {
			const roomEvent = (...args: any[]): void => publication._session.socket?.send(this.changedPayload(this.subscriptionName, 'id', {
				eventName: `${ uid }/rooms-changed`,
				args,
			}));
			const rooms: Pick<ISubscription, 'rid'>[] = Subscriptions.find({ 'u._id': uid }, { fields: { rid: 1 } }).fetch();
			rooms.forEach(({ rid }) => {
				this.on(rid, roomEvent);
			});

			const userEvent = (clientAction: string, { rid }: {rid: string}): void => {
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

class MessageStream extends Stream {
	getSubscriptionByUserIdAndRoomId(userId: string, rid: string): DDPSubscription | undefined {
		return [...this.subscriptions].find((sub) => sub.eventName === rid && sub.subscription.userId === userId);
	}

	async _publish(publication: Publication, eventName: string, options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		await super._publish(publication, eventName, options);
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		const userEvent = (clientAction: string, { rid }: {rid: string}): void => {
			switch (clientAction) {
				case 'removed':
					this.removeListener(uid, userEvent);
					const sub = this.getSubscriptionByUserIdAndRoomId(uid, rid);
					sub && this.removeSubscription(sub, eventName);
					break;
			}
		};
		this.on(uid, userEvent);
	}

	mymessage(eventName: string, args: any[]): void {
		const subscriptions = this.subscriptionsByEventName.get(eventName);
		if (!Array.isArray(subscriptions)) {
			return;
		}
		subscriptions.forEach(async ({ subscription }) => {
			// TODO: bring back the options
			const options = await this.isEmitAllowed(subscription, eventName, args);
			if (options) {
				subscription._session.socket?.send(this.changedPayload(this.subscriptionName, 'id', {
					eventName,
					args: [args, options],
				}));
			}
		});
	}
}

const notifications = new NotificationsModule(Stream, RoomStreamer, MessageStream);
export default notifications;

notifications.streamRoomUsers.allowWrite(async function(eventName, ...args) {
	const [roomId, e] = eventName.split('/');
	// const user = Meteor.users.findOne(this.userId, {
	// 	fields: {
	// 		username: 1
	// 	}
	// });
	if (Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
		const subscriptions: ISubscription[] = Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
		subscriptions.forEach((subscription) => notifications.notifyUser(subscription.u._id, e, ...args));
	}
	return false;
});

notifications.streamRoom.allowRead(async function(eventName, extraData) {
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

notifications.streamRoom.allowWrite(async function(eventName, username, _typing, extraData) {
	const [roomId, e] = eventName.split('/');

	// if (isNaN(parseFloat(e)) ? e === WEB_RTC_EVENTS.WEB_RTC : parseFloat(e) === WEB_RTC_EVENTS.WEB_RTC) {
	if (e === WEB_RTC_EVENTS.WEB_RTC) {
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
		}) as IUser;

		if (!user) {
			return false;
		}

		return user[key] === username;
	}
	return false;
});

notifications.streamLivechatQueueData.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

notifications.streamIntegrationHistory.allowRead(function() {
	return this.userId && hasAtLeastOnePermission(this.userId, [
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
	]);
});

notifications.streamLivechatRoom.allowRead(async function(roomId, extraData) {
	const room = LivechatRooms.findOneById(roomId);

	if (!room) {
		console.warn(`Invalid eventName: "${ roomId }"`);
		return false;
	}

	if (room.t === 'l' && extraData && extraData.visitorToken && room.v.token === extraData.visitorToken) {
		return true;
	}
	return false;
});

notifications.streamStdout.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-logs') : false;
});

notifications.streamCannedResponses.allowRead(function() {
	return this.userId && settings.get('Canned_Responses_Enable') && hasPermission(this.userId, 'view-canned-responses');
});

notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return hasAtLeastOnePermission(this.userId, ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']);
});

notifications.streamRoomData.allowRead(function(rid) {
	try {
		const room = Meteor.call('canAccessRoom', rid, this.userId);
		if (!room) {
			return false;
		}

		return roomTypes.getConfig(room.t).isEmitAllowed();
	} catch (error) {
		return false;
	}
});

notifications.streamRoomMessage.allowRead(async function(eventName, args) {
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

notifications.streamRoomMessage.allowEmit('__my_messages__', async function(_eventName, msg) {
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

notifications.streamRoomMessage.allowRead(async function(eventName, args) {
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
