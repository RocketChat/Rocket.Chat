import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useCallContext, useCallerInfo } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const OmniChannelCallDialPad = (): ReactElement => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const voIPcall = useCallContext();
	const caller = useCallerInfo();

	const isMakeCallEnabled = voIPcall.enabled && voIPcall.ready && 'outBoundCallsAllowed' in voIPcall && voIPcall.outBoundCallsAllowed;

	const isDialPadDisabled = !isMakeCallEnabled || ['IN_CALL', 'ON_HOLD', 'UNREGISTERED'].includes(caller.state);

	return (
		<Sidebar.TopBar.Action
			title={isMakeCallEnabled ? t('New_Call') : t('New_Call_Enterprise_Edition_Only')}
			icon='dialpad'
			onClick={(): void => openDialModal()}
			disabled={isDialPadDisabled}
		/>
	);
};
