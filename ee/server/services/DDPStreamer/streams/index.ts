import { Stream } from '../Streamer';
import { NotificationsModule } from '../../../../../server/modules/notifications/notifications.module';
import { ISubscription } from '../../../../../definition/ISubscription';
import { getCollection, Collections } from '../../mongo';
import { Authorization } from '../../../../../server/sdk';
import { Publication } from '../../../../../server/modules/streamer/streamer.module';

export class RoomStreamer extends Stream {
	async _publish(publication: Publication, eventName = '', options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		super._publish(publication, eventName, options);
		// const uid = Meteor.userId();
		const { userId } = publication.client;
		if (/rooms-changed/.test(eventName)) {
			// TODO: change this to serialize only once
			const roomEvent = (...args: any[]): void => {
				const payload = this.changedPayload(this.subscriptionName, 'id', {
					eventName: `${ userId }/rooms-changed`,
					args,
				});

				payload && publication.client?.send(
					publication,
					payload,
				);
			};

			const Subscription = await getCollection<ISubscription>(Collections.Subscriptions);

			const subscriptions = await Subscription.find<Pick<ISubscription, 'rid'>>(
				{ 'u._id': userId },
				{ projection: { rid: 1 } },
			).toArray();

			subscriptions.forEach(({ rid }) => {
				this.on(rid, roomEvent);
			});

			const userEvent = (clientAction: string, { rid }: Partial<ISubscription> = {}): void => {
				if (!rid) {
					return;
				}

				switch (clientAction) {
					case 'inserted':
						subscriptions.push({ rid });
						this.on(rid, roomEvent);
						break;

					case 'removed':
						this.removeListener(rid, roomEvent);
						break;
				}
			};
			this.on(userId, userEvent);

			publication.onStop(() => {
				this.removeListener(userId, userEvent);
				subscriptions.forEach(({ rid }) => this.removeListener(rid, roomEvent));
			});
		}
	}
}

class MessageStream extends Stream {
	// TODO: implement the code bellow
	// getSubscriptionByUserIdAndRoomId(userId, rid) {
	// 	return this.subscriptions.find((sub) => sub.eventName === rid && sub.subscription.userId === userId);
	// }

	// _publish(publication, eventName, options) {
	// 	super._publish(publication, eventName, options);
	// 	const uid = Meteor.userId();

	// 	const userEvent = (clientAction, { rid }) => {
	// 		switch (clientAction) {
	// 			case 'removed':
	// 				this.removeListener(uid, userEvent);
	// 				this.removeSubscription(this.getSubscriptionByUserIdAndRoomId(uid, rid), eventName);
	// 				break;
	// 		}
	// 	};
	// 	this.on(uid, userEvent);
	// }

	// mymessage = (eventName, args) => {
	// 	const subscriptions = this.subscriptionsByEventName[eventName];
	// 	if (!Array.isArray(subscriptions)) {
	// 		return;
	// 	}
	// 	subscriptions.forEach(({ subscription }) => {
	// 		const options = this.isEmitAllowed(subscription, eventName, args);
	// 		if (options) {
	// 			send(subscription._session, changedPayload(this.subscriptionName, 'id', {
	// 				eventName,
	// 				args: [args, options],
	// 			}));
	// 		}
	// 	});
	// }
}

const notifications = new NotificationsModule(Stream, RoomStreamer, MessageStream);

export default notifications;

// TODO: Implementation not complete
notifications.streamRoomMessage.allowRead(async function(rid) {
	return !!this.userId && Authorization.canAccessRoom({ _id: rid }, { _id: this.userId });
});


// export const streamRoomData = new Stream(STREAM_NAMES.ROOM_DATA);
notifications.streamRoomData.allowRead(async function(rid) {
	return !!this.userId && Authorization.canAccessRoom({ _id: rid }, { _id: this.userId });
});

notifications.streamLivechatQueueData.allowRead(async function() {
	return !!this.userId && Authorization.hasPermission(this.userId, 'view-l-room');
});

// TODO: Implement permission
// this.streamCannedResponses.allowRead(function() { // Implemented outside
// this.streamLivechatRoom.allowRead((roomId, extraData) => { // Implemented outside


// TODO: Implement permission
// const self = this;
// notifications.streamRoomUsers.allowWrite(function(eventName, ...args) {
// 	const [roomId, e] = eventName.split('/');
// 	// const user = Meteor.users.findOne(this.userId, {
// 	// 	fields: {
// 	// 		username: 1
// 	// 	}
// 	// });
// 	if (Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
// 		const subscriptions = Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
// 		subscriptions.forEach((subscription) => self.notifyUser(subscription.u._id, e, ...args));
// 	}
// 	return false;
// });

// TODO: Implement permission
// notifications.streamRoom.allowRead(function(eventName, extraData) {
// 	const [roomId] = eventName.split('/');
// 	const room = Rooms.findOneById(roomId);
// 	if (!room) {
// 		console.warn(`Invalid streamRoom eventName: "${ eventName }"`);
// 		return false;
// 	}
// 	if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
// 		return true;
// 	}
// 	if (this.userId == null) {
// 		return false;
// 	}
// 	const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { fields: { _id: 1 } });
// 	return subscription != null;
// });

// TODO: Implement permission
// notifications.streamRoom.allowWrite(function(eventName, username, typing, extraData) {
// 	const [roomId, e] = eventName.split('/');

// 	if (isNaN(e) ? e === WEB_RTC_EVENTS.WEB_RTC : parseFloat(e) === WEB_RTC_EVENTS.WEB_RTC) {
// 		return true;
// 	}

// 	if (e === 'typing') {
// 		const key = settings.get('UI_Use_Real_Name') ? 'name' : 'username';
// 		// typing from livechat widget
// 		if (extraData && extraData.token) {
// 			const room = Rooms.findOneById(roomId);
// 			if (room && room.t === 'l' && room.v.token === extraData.token) {
// 				return true;
// 			}
// 		}

// 		const user = Meteor.users.findOne(this.userId, {
// 			fields: {
// 				[key]: 1,
// 			},
// 		});

// 		if (!user) {
// 			return false;
// 		}

// 		return user[key] === username;
// 	}
// 	return false;
// });
