import { useDebugValue } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppId } from '../contexts/AppIdContext.js';

export const useAppTranslation = () => {
	const appId = useAppId();
	const appNs = appId.endsWith(`-core`) ? undefined : `app-${appId}`;

	useDebugValue(appNs);

	return useTranslation(appNs);
};
