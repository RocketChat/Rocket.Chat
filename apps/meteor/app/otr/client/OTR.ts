import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { ReactiveVar } from 'meteor/reactive-var';

import { Subscriptions } from '../../models/client';
import type { IOTR } from '../lib/IOTR';
import { OTRRoom } from './OTRRoom';

class OTR implements IOTR {
	private enabled: ReactiveVar<boolean>;

	private instancesByRoomId: { [rid: string]: OTRRoom };

	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
	}

	setEnabled(enabled: boolean): void {
		this.enabled.set(enabled);
	}

	getInstanceByRoomId(uid: IUser['_id'], rid: IRoom['_id']): OTRRoom | undefined {
		if (!this.enabled.get()) {
			return;
		}

		if (this.instancesByRoomId[rid]) {
			return this.instancesByRoomId[rid];
		}

		const subscription = Subscriptions.findOne({ rid });

		if (!subscription || subscription.t !== 'd') {
			return;
		}

		this.instancesByRoomId[rid] = new OTRRoom(uid, rid);
		return this.instancesByRoomId[rid];
	}
}

export default new OTR();
