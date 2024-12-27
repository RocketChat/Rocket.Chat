import { Sidebar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const OmniChannelCallDialPad = ({ ...props }): ReactElement => {
	const { t } = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<Sidebar.TopBar.Action
			icon='dialpad'
			onClick={(): void => openDialModal()}
			disabled={!outBoundCallsEnabledForUser}
			aria-label={t('Open_Dialpad')}
			data-tooltip={outBoundCallsAllowed ? t('New_Call') : t('New_Call_Premium_Only')}
			{...props}
		/>
	);
};
