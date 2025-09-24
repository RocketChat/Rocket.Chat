import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { IRoomNativeFederated, IRoom } from '@rocket.chat/core-typings';

import { throwIfFederationNotEnabled } from '../../federation/utils';

export class FederationActions {
	public static shouldPerformFederationAction(room: IRoom): room is IRoomNativeFederated {
		if (!isRoomFederated(room)) {
			return false;
		}

		if (!isRoomNativeFederated(room)) {
			throw new Error('Room is federated but its not native implementation');
		}

		return true;
	}

	public static blockIfRoomFederatedButServiceNotReady(room: IRoom) {
		if (!isRoomFederated(room)) {
			return;
		}

		if (!isRoomNativeFederated(room)) {
			throw new Error('Room is federated but its not native implementation');
		}

		throwIfFederationNotEnabled();
	}
}
