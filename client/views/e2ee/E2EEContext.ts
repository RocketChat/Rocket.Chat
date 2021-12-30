import { createContext, useContext } from 'react';

import { E2EECapabilities } from '../../lib/e2ee/E2EECapabilities';
import { E2EEFlags } from '../../lib/e2ee/E2EEFlags';

type E2EEContextValue = {
	supported: boolean;
	activable: boolean;
	enabled: boolean;
	active: boolean;
	keyPair?: CryptoKeyPair;
};

export const E2EEContext = createContext<E2EEContextValue>({
	supported: false,
	activable: false,
	enabled: false,
	active: false,
});

export const useE2EECapabilities = (): E2EECapabilities => {
	const { keyPair } = useContext(E2EEContext);

	return {
		canEncrypt: Boolean(keyPair),
		canDecrypt: Boolean(keyPair),
	};
};

export const useE2EEFlags = (): E2EEFlags => {
	const { supported, activable, enabled, active } = useContext(E2EEContext);

	return { supported, activable, enabled, active };
};
