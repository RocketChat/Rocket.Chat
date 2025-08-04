import { isMessageFromMatrixFederation, isRoomFederated } from '@rocket.chat/core-typings';
import type { AtLeast, IMessage, IRoom } from '@rocket.chat/core-typings';

import { getFederationVersion, isFederationEnabled, isFederationReady } from '../../federation/utils';

export class FederationActions {
	public static shouldPerformAction(message: IMessage, room: AtLeast<IRoom, 'federated'>): boolean {
		if (isMessageFromMatrixFederation(message) || isRoomFederated(room)) {
			return getFederationVersion() === 'native' || (isFederationEnabled() && isFederationReady());
		}

		return true;
	}
}
