import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useVoipOutboundStates } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const OmniChannelCallDialPad = ({ ...props }): ReactElement => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<Sidebar.TopBar.Action
			title={outBoundCallsAllowed ? t('New_Call') : t('New_Call_Enterprise_Edition_Only')}
			icon='dialpad'
			onClick={(): void => openDialModal()}
			disabled={!outBoundCallsEnabledForUser}
			aria-label={t('Open_Dialpad')}
			{...props}
		/>
	);
};
