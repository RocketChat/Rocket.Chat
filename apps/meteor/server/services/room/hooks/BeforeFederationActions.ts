import type { IRoom } from '@rocket.chat/core-typings';

import { getFederationVersion, throwIfFederationNotEnabledOrNotReady } from '../../federation/utils';

export class FederationActions {
	public static blockIfRoomFederatedButServiceNotReady({ federated }: Pick<IRoom, 'federated'>) {
		if (getFederationVersion() !== 'matrix') {
			return;
		}

		if (!federated) {
			return;
		}

		throwIfFederationNotEnabledOrNotReady();
	}
}
