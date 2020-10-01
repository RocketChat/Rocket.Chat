import { Stream } from '../Streamer';
import { NotificationsModule } from '../../../../../server/modules/notifications/notifications.module';
import { ISubscription } from '../../../../../definition/ISubscription';
import { IRoom } from '../../../../../definition/IRoom';
import { IUser } from '../../../../../definition/IUser';
import { ISetting } from '../../../../../definition/ISetting';
import { getCollection, Collections, getConnection } from '../../mongo';
// import { Authorization } from '../../../../../server/sdk';
import { Publication } from '../../../../../server/modules/streamer/streamer.module';
import { RoomsRaw } from '../../../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../../../app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../../../app/models/server/raw/Users';
import { SettingsRaw } from '../../../../../app/models/server/raw/Settings';

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

getConnection()
	.then((db) => {
		notifications.configure({
			Rooms: new RoomsRaw(db.collection<IRoom>(Collections.Rooms)),
			Subscriptions: new SubscriptionsRaw(db.collection<ISubscription>(Collections.Subscriptions)),
			Users: new UsersRaw(db.collection<IUser>(Collections.User)),
			Settings: new SettingsRaw(db.collection<ISetting>(Collections.Settings)),
		});
	});

export default notifications;

// TODO: Implementation not complete
// notifications.streamRoomMessage.allowRead(async function(rid) {
// 	return !!this.userId && Authorization.canAccessRoom({ _id: rid }, { _id: this.userId });
// });

// notifications.streamLivechatQueueData.allowRead(async function() {
// 	return !!this.userId && Authorization.hasPermission(this.userId, 'view-l-room');
// });

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
