import { Stream } from '../Streamer';
import { NotificationsModule } from '../../../../../server/modules/notifications/notifications.module';
import { ISubscription } from '../../../../../definition/ISubscription';
import { IRoom } from '../../../../../definition/IRoom';
import { IUser } from '../../../../../definition/IUser';
import { ISetting } from '../../../../../definition/ISetting';
import { getCollection, Collections, getConnection } from '../../mongo';
// import { Authorization } from '../../../../../server/sdk';
import { Publication, DDPSubscription } from '../../../../../server/modules/streamer/streamer.module';
import { RoomsRaw } from '../../../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../../../app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../../../app/models/server/raw/Users';
import { SettingsRaw } from '../../../../../app/models/server/raw/Settings';

export class RoomStreamer extends Stream {
	async _publish(publication: Publication, eventName: string, options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		await super._publish(publication, eventName, options);
		const { userId } = publication.client;
		if (!userId) {
			return;
		}

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

						// From Original Notifications.ts
						// after a subscription is added need to emit the room again
						// roomEvent('inserted', Rooms.findOneById(rid));
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
	getSubscriptionByUserIdAndRoomId(userId: string, rid: string): DDPSubscription | undefined {
		return [...this.subscriptions].find((sub) => sub.eventName === rid && sub.subscription.userId === userId);
	}

	async _publish(publication: Publication, eventName: string, options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		await super._publish(publication, eventName, options);
		const { userId } = publication.client;
		if (!userId) {
			return;
		}

		const userEvent = (clientAction: string, { rid }: {rid: string}): void => {
			switch (clientAction) {
				case 'removed':
					this.removeListener(userId, userEvent);
					const sub = this.getSubscriptionByUserIdAndRoomId(userId, rid);
					sub && this.removeSubscription(sub, eventName);
					break;
			}
		};
		this.on(userId, userEvent);
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
