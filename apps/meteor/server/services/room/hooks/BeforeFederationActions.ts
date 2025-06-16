import type { IRoom } from '@rocket.chat/core-typings';

import { throwIfFederationNotEnabledOrNotReady } from '../../federation/utils';

export class FederationActions {
	public static blockIfRoomFederatedButServiceNotReady({ federated }: Pick<IRoom, 'federated'>) {
		if (!federated) {
			return;
		}

		throwIfFederationNotEnabledOrNotReady();
	}
}
