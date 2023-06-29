import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getDesktopApp } from '../../../lib/utils/getDesktopApp';

export const useOutlookAuthentication = ({ onChangeRoute }: { onChangeRoute: () => void }) => {
	const t = useTranslation();
	const [authEnabled, setEnableAuth] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const desktopApp = getDesktopApp();
	const canSync = !!desktopApp?.getOutlookEvents;

	const { refetch } = useQuery(
		['checkOutlookCredentials'],
		async () => {
			return desktopApp?.hasOutlookCredentials() || false;
		},
		{
			onSuccess: (data) => {
				setEnableAuth(data);
			},
			onError: (error) => {
				console.error(error);
			},
		},
	);

	const handleDisableAuth = () => {
		desktopApp?.clearOutlookCredentials();
		onChangeRoute();
		dispatchToastMessage({ type: 'success', message: t('Outlook_authentication_disabled') });
	};

	return { authEnabled, canSync, handleDisableAuth, handleCheckCredentials: refetch };
};
