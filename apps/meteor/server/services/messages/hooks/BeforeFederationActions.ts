import type { AtLeast } from '@rocket.chat/core-typings';
import { type IMessage, type IRoom, isMessageFromMatrixFederation, isRoomFederated } from '@rocket.chat/core-typings';

import { isFederationEnabled, isFederationReady } from '../../federation/utils';

export class FederationActions {
	public static shouldPerformAction(message: IMessage, room: AtLeast<IRoom, 'federated'>): boolean {
		if (isMessageFromMatrixFederation(message) || isRoomFederated(room)) {
			return isFederationEnabled() && isFederationReady();
		}

		return true;
	}
}
