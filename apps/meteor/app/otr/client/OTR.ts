import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import type { IOTR } from '../lib/IOTR';
import { Subscriptions } from '../../models/client';
import { OTRRoom } from './OTRRoom';

class OTR implements IOTR {
	private enabled: ReactiveVar<boolean>;

	private instancesByRoomId: { [rid: string]: OTRRoom };

	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
	}

	isEnabled(): boolean {
		return this.enabled.get();
	}

	setEnabled(enabled: boolean): void {
		this.enabled.set(enabled);
	}

	getInstanceByRoomId(roomId: string): OTRRoom | undefined {
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}
		if (!this.enabled.get()) {
			return;
		}

		if (this.instancesByRoomId[roomId]) {
			return this.instancesByRoomId[roomId];
		}

		const subscription = Subscriptions.findOne({
			rid: roomId,
		});

		if (!subscription || subscription.t !== 'd') {
			return;
		}

		this.instancesByRoomId[roomId] = new OTRRoom(userId, roomId);
		return this.instancesByRoomId[roomId];
	}
}

export default new OTR();
