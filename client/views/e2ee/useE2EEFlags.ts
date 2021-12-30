import { useContext } from 'react';

import { E2EEFlags } from '../../lib/e2ee/E2EEFlags';
import { E2EEContext } from './E2EEContext';

export const useE2EEFlags = (): E2EEFlags => {
	const { supported, activable, enabled, active } = useContext(E2EEContext);

	return { supported, activable, enabled, active };
};
