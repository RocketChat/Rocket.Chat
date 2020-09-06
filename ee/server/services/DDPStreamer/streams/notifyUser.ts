import { Stream, send, changedPayload, publish } from '../Streamer';
import { STREAM_NAMES } from '../constants';
import { ISubscription } from '../../../../../definition/ISubscription';
import { getCollection, Collections } from '../../mongo';
import { Publication } from '../Publication';

class RoomStreamer extends Stream {
	async [publish](publication: Publication, eventName = '', options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		super[publish](publication, eventName, options);
		// const uid = Meteor.userId();
		const { uid } = publication.client;
		if (/rooms-changed/.test(eventName)) {
			// TODO: change this to serialize only once
			const roomEvent = (...args: any[]): void => {
				const payload = changedPayload(this.subscriptionName, {
					eventName: `${ uid }/rooms-changed`,
					args,
				});

				payload && send(
					publication,
					payload,
				);
			};

			const Subscription = await getCollection<ISubscription>(Collections.Subscriptions);

			const subscriptions = await Subscription.find<Pick<ISubscription, 'rid'>>(
				{ 'u._id': uid },
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
			this.on(uid, userEvent);

			publication.once('stop', () => {
				this.removeListener(uid, userEvent);
				subscriptions.forEach(({ rid }) => this.removeListener(rid, roomEvent));
			});
		}
	}
}

export const notifyUser = new RoomStreamer(STREAM_NAMES.NOTIFY_USER);
notifyUser.allowWrite('none');
notifyUser.allowRead('logged');

export const streamRoomData = new Stream(STREAM_NAMES.ROOM_DATA);
streamRoomData.allowRead(function(rid) {
	// TODO: missing method
	return this.client.broker.call('authorization.canAccessRoom', {
		room: { _id: rid },
		user: { _id: this.uid },
	});
});
