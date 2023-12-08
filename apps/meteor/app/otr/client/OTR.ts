import type { IRoom, IUser } from '@rocket.chat/core-typings';

import type { IOTR } from '../lib/IOTR';
import { OTRRoom } from './OTRRoom';

class OTR implements IOTR {
	private instancesByRoomId: { [rid: string]: OTRRoom };

	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(uid: IUser['_id'], rid: IRoom['_id']): OTRRoom | undefined {
		if (this.instancesByRoomId[rid]) {
			return this.instancesByRoomId[rid];
		}

		const otrRoom = OTRRoom.create(uid, rid);

		if (!otrRoom) {
			return undefined;
		}

		this.instancesByRoomId[rid] = otrRoom;
		return this.instancesByRoomId[rid];
	}
}

export default new OTR();
