import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import {
	useOmnichannelShowQueueLink,
	useOmnichannelAgentAvailable,
	useOmnichannelQueueLink,
	useOmnichannelDirectoryLink,
} from '../../contexts/OmnichannelContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const OmnichannelSection = (props) => {
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const t = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const directoryLink = useOmnichannelDirectoryLink();
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

	return (
		<Sidebar.TopBar.ToolBox {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && (
					<Sidebar.TopBar.Action icon='queue' title={t('Queue')} is='a' href={queueLink} />
				)}
				<Sidebar.TopBar.Action {...icon} onClick={handleStatusChange} />
				<Sidebar.TopBar.Action {...directoryIcon} href={directoryLink} is='a' />
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
