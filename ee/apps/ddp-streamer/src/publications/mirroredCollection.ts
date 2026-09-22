import type { Server } from '../ddp/Server';
import type { MirroredCollection } from '../lib/MirroredCollection';

/** Publishes a mirror as a DDP collection: replays what it holds, forwards its changes until the subscription stops. */
export function publishMirroredCollection<T>(server: Server, publication: string, collection: string, mirror: MirroredCollection<T>): void {
	server.publish(publication, function () {
		for (const [id, record] of mirror.entries()) {
			this.added(collection, id, record);
		}

		const off = mirror.onChange((change) => {
			if (change.action === 'removed') {
				this.removed(collection, change.id);
				return;
			}
			this[change.action](collection, change.id, change.record);
		});

		this.onStop(off);

		this.ready();
	});
}
