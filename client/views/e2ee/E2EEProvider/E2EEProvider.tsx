import React, { ContextType, ReactElement, ReactNode, useEffect, useMemo } from 'react';

import { attachE2EEManagement } from '../../../lib/e2ee/attachE2EEManagement';
import { E2EEContext } from '../E2EEContext';
import { useFlags } from './useFlags';
import { useUserKeys } from './useUserKeys';

type E2EEProviderProps = {
	children: ReactNode;
};

const E2EEProvider = ({ children }: E2EEProviderProps): ReactElement => {
	const { supported, activable, enabled } = useFlags();

	const active = supported && activable && enabled;

	const { data: keyPair } = useUserKeys({ enabled: active });

	// TODO: remove it ASAP
	useEffect(() => attachE2EEManagement(), []);

	const value: ContextType<typeof E2EEContext> = useMemo(
		() => ({
			flags: {
				supported,
				activable,
				enabled,
			},
			active,
			keyPair,
		}),
		[supported, activable, enabled, active, keyPair],
	);

	return <E2EEContext.Provider children={children} value={value} />;
};

export default E2EEProvider;
