import { Sidebar } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import DialPadModal from '../../../../ee/client/voip/modal/DialPad/DialPadModal';
import { useCallContext, useCallerInfo } from '../../../contexts/CallContext';

export const OmniChannelCallDialPad = (): ReactElement => {
	const setModal = useSetModal();
	const t = useTranslation();

	const voIPcall = useCallContext();
	const caller = useCallerInfo();

	const isMakeCallEnabled = voIPcall.enabled && voIPcall.ready && 'canMakeCall' in voIPcall && voIPcall.canMakeCall;

	const isDialPadDisabled = !isMakeCallEnabled || ['IN_CALL', 'ON_HOLD', 'UNREGISTERED'].includes(caller.state);

	const openDialModal = useCallback(() => setModal(<DialPadModal handleClose={(): void => setModal(null)} />), [setModal]);

	return (
		<Sidebar.TopBar.Action
			title={isMakeCallEnabled ? t('New_Call') : t('New_Call_Enterprise_Edition_Only')}
			icon='dialpad'
			onClick={openDialModal}
			disabled={isDialPadDisabled}
		/>
	);
};
