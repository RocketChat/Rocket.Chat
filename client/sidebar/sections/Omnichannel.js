import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import { hasPermission } from '../../../app/authorization/client';
import { useLayout } from '../../contexts/LayoutContext';
import {
	useOmnichannelShowQueueLink,
	useOmnichannelAgentAvailable,
	useOmnichannelQueueLink,
} from '../../contexts/OmnichannelContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const OmnichannelSection = (props) => {
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const t = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');
	const dispatchToastMessage = useToastMessageDispatch();

	const icon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		color: agentAvailable ? 'success' : undefined,
		icon: agentAvailable ? 'message' : 'message-disabled',
		...(agentAvailable && { success: 1 }),
	};

	const directoryIcon = {
		title: t('Contact_Center'),
		icon: 'contact',
	};
	const handleStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			console.log(error);
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
				<Sidebar.TopBar.Action {...icon} onClick={handleStatusChange} />
				{hasPermission(['view-omnichannel-contact-center']) && (
					<Sidebar.TopBar.Action {...directoryIcon} onClick={handleDirectory} />
				)}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
