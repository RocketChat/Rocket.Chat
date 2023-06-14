import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect, useCallback } from 'react';

import { getDesktopApp } from '../../lib/utils/getDesktopApp';

export const useOutlookAuthentication = ({ onChangeRoute }: { onChangeRoute: () => void }) => {
	const t = useTranslation();
	const [authEnabled, setEnableAuth] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const desktopApp = getDesktopApp();
	const canSync = !!desktopApp?.getOutlookEvents;

	const handleCheckCredentials = useCallback(async () => {
		try {
			const isAuth = await desktopApp?.hasOutlookCredentials();
			setEnableAuth(isAuth || false);
		} catch (error) {
			console.error(error);
		}
	}, [desktopApp]);

	useEffect(() => {
		handleCheckCredentials();
	}, [handleCheckCredentials]);

	const handleDisableAuth = () => {
		desktopApp?.clearOutlookCredentials();
		onChangeRoute();
		dispatchToastMessage({ type: 'success', message: t('Outlook_authentication_disabled') });
	};

	return { authEnabled, canSync, handleDisableAuth, handleCheckCredentials };
};
