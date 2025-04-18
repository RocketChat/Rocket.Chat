import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useVoipDialer, useVoipState } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useVoipDialerAction = () => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const { clientError, isReady, isRegistered } = useVoipState();
	const { open: isDialerOpen, openDialer, closeDialer } = useVoipDialer();

	const handleToggleDialer = useEffectEvent(() => {
		sidebar.toggle();
		isDialerOpen ? closeDialer() : openDialer();
	});

	const title = useMemo(() => {
		if (!isReady && !clientError) {
			return t('Loading');
		}

		if (!isRegistered || clientError) {
			return t('Voice_calling_disabled');
		}

		return t('New_Call');
	}, [clientError, isReady, isRegistered, t]);

	return { handleToggleDialer, title, isPressed: isDialerOpen, isDisabled: !isReady || !isRegistered };
};
