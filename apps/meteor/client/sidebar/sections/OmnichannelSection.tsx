import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useLayout,
	useToastMessageDispatch,
	useRoute,
	usePermission,
	useMethod,
	useTranslation,
	useSetModal,
} from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useCallback } from 'react';

import { useHasLicense } from '../../../ee/client/hooks/useHasLicense';
import DialPadModal from '../../../ee/client/voip/modal/DialPad/DialPadModal';
import { useIsCallEnabled } from '../../contexts/CallContext';
import { useOmnichannelAgentAvailable } from '../../hooks/omnichannel/useOmnichannelAgentAvailable';
import { useOmnichannelShowQueueLink } from '../../hooks/omnichannel/useOmnichannelShowQueueLink';
import { OmnichannelCallToggle } from './actions/OmnichannelCallToggle';
import { useVoipAgent } from './hooks/useVoipAgent';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const isCallEnabled = useIsCallEnabled();
	const { agentEnabled, registered } = useVoipAgent();
	const hasPermission = usePermission('view-omnichannel-contact-center');
	const agentAvailable = useOmnichannelAgentAvailable();
	const voipLicense = useHasLicense('voip-enterprise');
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');
	const queueListRoute = useRoute('livechat-queue');
	const dispatchToastMessage = useToastMessageDispatch();

	const omnichannelIcon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		color: agentAvailable ? 'success' : undefined,
		icon: agentAvailable ? 'message' : 'message-disabled',
	} as const;

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleRoute = useMutableCallback((route) => {
		sidebar.toggle();

		switch (route) {
			case 'directory':
				directoryRoute.push({});
				break;
			case 'queue':
				queueListRoute.push({});
				break;
		}
	});

	const openDialModal = useCallback(() => {
		if (voipLicense) {
			return setModal(<DialPadModal handleClose={(): void => setModal(null)} />);
		}

		dispatchToastMessage({ type: 'error', message: t('You_do_not_have_permission_to_do_this') });
	}, [voipLicense, dispatchToastMessage, t, setModal]);

	// The className is a paliative while we make TopBar.ToolBox optional on fuselage
	return (
		<Sidebar.TopBar.ToolBox className='omnichannel-sidebar' {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && <Sidebar.TopBar.Action icon='queue' title={t('Queue')} onClick={(): void => handleRoute('queue')} />}
				{isCallEnabled && <OmnichannelCallToggle />}
				<Sidebar.TopBar.Action {...omnichannelIcon} onClick={handleAvailableStatusChange} />
				{hasPermission && (
					<Sidebar.TopBar.Action title={t('Contact_Center')} icon='contact' onClick={(): void => handleRoute('directory')} />
				)}
				{isCallEnabled && (
					<Sidebar.TopBar.Action
						title={voipLicense ? t('New_Call') : t('New_Call_Enterprise_Edition_Only')}
						icon='dialpad'
						onClick={openDialModal}
						disabled={!agentEnabled || !registered}
					/>
				)}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
