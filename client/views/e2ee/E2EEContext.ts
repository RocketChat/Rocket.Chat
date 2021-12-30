import { createContext } from 'react';

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
