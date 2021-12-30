import { useContext } from 'react';

import { E2EECapabilities } from '../../lib/e2ee/E2EECapabilities';
import { E2EEContext } from './E2EEContext';

export const useE2EECapabilities = (): E2EECapabilities => {
	const { keyPair } = useContext(E2EEContext);

	return {
		canEncrypt: Boolean(keyPair),
		canDecrypt: Boolean(keyPair),
	};
};
