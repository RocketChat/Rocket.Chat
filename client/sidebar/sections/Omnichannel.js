import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useOmnichannelShowQueueLink, useOmnichannelAgentAvailable, useOmnichannelQueueLink, useOmnichannelDirectoryLink } from '../../contexts/OmnichannelContext';

const OmnichannelSection = React.memo((props) => {
	const method = useMethod('livechat:changeLivechatStatus');
	const t = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const directoryLink = useOmnichannelDirectoryLink();

	const icon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		icon: agentAvailable ? 'message' : 'message-disabled',
		...agentAvailable && { success: 1 },
	};

	const directoryIcon = {
		title: t('Omnichannel_Directory'),
		icon: 'contact',
	};

	return <Sidebar.TopBar.ToolBox { ...props }>
		<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
		<Sidebar.TopBar.Actions>
			{showOmnichannelQueueLink && <Sidebar.TopBar.Action icon='queue' title={t('Queue')} is='a' href={queueLink}/> }
			<Sidebar.TopBar.Action {...icon} onClick={() => { method(); }}/>
			<Sidebar.TopBar.Action {...directoryIcon} href={directoryLink} is='a' />
		</Sidebar.TopBar.Actions>
	</Sidebar.TopBar.ToolBox>;
});

export default OmnichannelSection;

OmnichannelSection.size = 56;
