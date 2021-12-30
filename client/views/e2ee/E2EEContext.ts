import { createContext } from 'react';

import { E2EEFlags } from '../../lib/e2ee/E2EEFlags';

type E2EEContextValue = {
	flags: E2EEFlags;
	active: boolean;
	keyPair?: CryptoKeyPair;
};

export const E2EEContext = createContext<E2EEContextValue>({
	flags: {
		supported: false,
		activable: false,
		enabled: false,
	},
	active: false,
});
