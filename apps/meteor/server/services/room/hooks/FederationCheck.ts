import { isFederationEnabled, isFederationReady } from '../../federation/utils';

export class FederationCheck {
	public static blockIfFederationEnabledButNotReady({ federated = false }: { federated?: boolean }) {
		if (federated && isFederationEnabled() && !isFederationReady()) {
			throw new Error('Federation configuration is invalid');
		}
	}
}
