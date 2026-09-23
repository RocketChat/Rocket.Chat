import type { Server } from '../ddp/Server';
import type { MeteorCollection } from '../lib/MeteorCollection';

/** Publishes a Meteor collection copy to DDP clients: replays what it holds, then forwards its changes until the subscription stops. */
export function publishMeteorCollection<T>(
	server: Server,
	publication: string,
	collectionName: string,
	collection: MeteorCollection<T>,
): void {
	server.publish(publication, function () {
		for (const [id, record] of collection.entries()) {
			this.added(collectionName, id, record);
		}

		const off = collection.onChange((change) => {
			if (change.action === 'removed') {
				this.removed(collectionName, change.id);
				return;
			}
			this[change.action](collectionName, change.id, change.record);
		});

		this.onStop(off);

		this.ready();
	});
}
