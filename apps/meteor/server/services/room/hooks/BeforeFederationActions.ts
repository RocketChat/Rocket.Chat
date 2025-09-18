import { isRoomFederated, isRoomNativeFederated, type IRoom } from '@rocket.chat/core-typings';

import { isFederationEnabled, throwIfFederationNotEnabledOrNotReady } from '../../federation/utils';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class FederationActions {
	public static blockIfRoomFederatedButServiceNotReady(room: IRoom) {
		if (!isRoomNativeFederated(room) && !isRoomFederated(room)) {
			return;
		}

		if (!isFederationEnabled()) {
			return;
		}

		throwIfFederationNotEnabledOrNotReady();
	}
}
