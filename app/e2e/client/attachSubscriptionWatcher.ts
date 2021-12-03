import { e2e } from './rocketchat.e2e';
import { Subscriptions } from '../../models/client';
import { ISubscription } from '../../../definition/ISubscription';

export const attachSubscriptionWatcher = (): (() => void) => {
	const watcher = Subscriptions.find().observe({
		changed: async (doc: ISubscription) => {
			if (!doc.encrypted && !doc.E2EKey) {
				e2e.removeInstanceByRoomId(doc.rid);
				return;
			}

			const e2eRoom = await e2e.getInstanceByRoomId(doc.rid);
			if (!e2eRoom) {
				return;
			}

			doc.encrypted ? e2eRoom.resume() : e2eRoom.pause();

			// Cover private groups and direct messages
			if (!e2eRoom.isSupportedRoomType(doc.t)) {
				e2eRoom.disable();
				return;
			}

			if (doc.E2EKey && e2eRoom.isWaitingKeys()) {
				e2eRoom.keyReceived();
				return;
			}

			if (!e2eRoom.isReady()) {
				return;
			}

			e2eRoom.decryptSubscription();
		},
		added: async (doc: ISubscription) => {
			if (!doc.encrypted && !doc.E2EKey) {
				return;
			}
			return e2e.getInstanceByRoomId(doc.rid);
		},
		removed: (doc: ISubscription) => {
			e2e.removeInstanceByRoomId(doc.rid);
		},
	});

	return (): void => {
		watcher.stop();
	};
};
