import React, { ReactElement, ReactNode } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import { useCurrentRoute, useRoutePath } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useUserId } from '../../contexts/UserContext';
import E2EEUserKeysProvider from './E2EEUserKeysProvider';

const useIsEnabled = window.crypto
	? (): boolean => {
			const uid = useUserId();
			const { isEmbedded } = useLayout();
			const [currentRouteName = '', currentParameters = {}] = useCurrentRoute();
			const currentRoutePath = useRoutePath(currentRouteName, currentParameters);
			const e2eeSettingEnabled = Boolean(useSetting('E2E_Enable'));

			if (!uid) {
				return false;
			}

			if (isEmbedded && currentRoutePath?.startsWith('/admin')) {
				return false;
			}

			return e2eeSettingEnabled;
	  }
	: (): boolean => false;

type E2EEProviderProps = {
	children: ReactNode;
};

const E2EEProvider = ({ children }: E2EEProviderProps): ReactElement => {
	const uid = useUserId();
	const enabled = useIsEnabled();

	if (!uid || !enabled) {
		return <>{children}</>;
	}

	return <E2EEUserKeysProvider uid={uid}>{children}</E2EEUserKeysProvider>;
};

export default E2EEProvider;
