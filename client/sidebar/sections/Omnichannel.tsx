import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement, useCallback, useState } from 'react';

import {
	useOmnichannelShowQueueLink,
	useOmnichannelQueueLink,
	useOmnichannelDirectoryLink,
	useOmnichannelAgentAvailable,
	useOmnichannelVoipCallAvailable,
} from '../../contexts/OmnichannelContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const [voipCallAvailable, setVoipCallAvailable] = useState(useOmnichannelVoipCallAvailable());

	const agentAvailable = useOmnichannelAgentAvailable();

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const directoryLink = useOmnichannelDirectoryLink();

	const voipCallIcon = {
		title: voipCallAvailable ? t('Available') : t('Not_Available'),
		color: voipCallAvailable ? 'success' : undefined,
		icon: voipCallAvailable ? 'phone' : 'phone-disabled',
	};

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
			console.log(error);
		}
	});

	const handleVoipCallStatusChange = useCallback(() => {
		// TODO: backend set voip call status
		setVoipCallAvailable(!voipCallAvailable);
	}, [voipCallAvailable]);

	return (
		<Sidebar.TopBar.ToolBox {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && (
					<Sidebar.TopBar.Action icon='queue' title={t('Queue')} is='a' href={queueLink} />
				)}
				<Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} />
				<Sidebar.TopBar.Action {...availableIcon} onClick={handleAvailableStatusChange} />
				<Sidebar.TopBar.Action {...directoryIcon} href={directoryLink} is='a' />
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
