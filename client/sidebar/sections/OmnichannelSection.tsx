import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement, useRef } from 'react';

import { ClientLogger } from '../../../lib/ClientLogger';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useIsCallEnabled } from '../../contexts/CallContext';
import { useLayout } from '../../contexts/LayoutContext';
import {
	useOmnichannelShowQueueLink,
	useOmnichannelQueueLink,
	useOmnichannelAgentAvailable,
} from '../../contexts/OmnichannelContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { OmnichannelCallToogle } from './components/OmnichannelCallToogle';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const isCallEnabled = useIsCallEnabled();
	const hasPermission = usePermission('view-omnichannel-contact-center');
	// const [registered, setRegistered] = useState(false);
	const agentAvailable = useOmnichannelAgentAvailable();

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();

	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');

	const availableIcon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		color: agentAvailable ? 'success' : undefined,
		icon: agentAvailable ? 'message' : 'message-disabled',
	};

	const directoryIcon = {
		title: t('Contact_Center'),
		icon: 'contact',
	};

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
			loggerRef.current?.error(`handleAvailableStatusChange ${error}`);
		}
	});

	const handleDirectory = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({});
	});

	return (
		<Sidebar.TopBar.ToolBox {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && (
					<Sidebar.TopBar.Action icon='queue' title={t('Queue')} is='a' href={queueLink} />
				)}
				{isCallEnabled && <OmnichannelCallToogle />}
				<Sidebar.TopBar.Action {...availableIcon} onClick={handleAvailableStatusChange} />
				{hasPermission && <Sidebar.TopBar.Action {...directoryIcon} onClick={handleDirectory} />}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
