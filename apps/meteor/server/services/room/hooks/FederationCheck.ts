import { throwIfFederationNotEnabledOrNotReady } from '../../federation/utils';

export class FederationCheck {
	public static blockIfRoomFederatedButServiceNotReady({ federated = false }: { federated?: boolean }) {
		if (!federated) {
			return;
		}

		throwIfFederationNotEnabledOrNotReady();
	}
}
