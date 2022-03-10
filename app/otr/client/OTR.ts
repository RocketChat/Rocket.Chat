import { IOTR } from '../../../definition/IOTR';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Subscriptions } from '../../models/client';
import { OTRRoom } from './OTRRoom';

class OTR implements IOTR {
	enabled: ReactiveVar<boolean>;

	instancesByRoomId: { [rid: string]: OTRRoom };

	crypto: SubtleCrypto;
	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
	}

	isEnabled(): boolean {
		return this.enabled.get();
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

		this.instancesByRoomId[roomId] = new OTRRoom(userId, roomId); // eslint-disable-line no-use-before-define
		return this.instancesByRoomId[roomId];
	}
}

export default new OTR();
