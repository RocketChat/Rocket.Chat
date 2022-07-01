import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useCallContext } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const OmniChannelCallDialPad = (): ReactElement => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const voIPCall = useCallContext();

	const isMakeCallEnabled = voIPCall.enabled && voIPCall.ready && voIPCall.outBoundCallsAllowed;

	const isDialPadDisabled = !voIPCall.outBoundCallsEnabledForUser;

	return (
		<Sidebar.TopBar.Action
			title={isMakeCallEnabled ? t('New_Call') : t('New_Call_Enterprise_Edition_Only')}
			icon='dialpad'
			onClick={(): void => openDialModal()}
			disabled={isDialPadDisabled}
		/>
	);
};
