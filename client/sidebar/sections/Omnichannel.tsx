import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement, useState, useCallback, useRef } from 'react';

import { hasPermission } from '../../../app/authorization/client';
import { ClientLogger } from '../../../lib/ClientLogger';
import { VoipEvents } from '../../components/voip/SimpleVoipUser';
import { useLayout } from '../../contexts/LayoutContext';
import {
	useIsVoipLibReady,
	useVoipUser,
	useOmnichannelShowQueueLink,
	useOmnichannelQueueLink,
	useOmnichannelAgentAvailable,
	useOmnichannelVoipCallAvailable,
} from '../../contexts/OmnichannelContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const voipCallAvailable = useState(useOmnichannelVoipCallAvailable());
	const [registered, setRegistered] = useState(false);
	const voipLibIsReady = useIsVoipLibReady();
	const voipLib = useVoipUser();
	const agentAvailable = useOmnichannelAgentAvailable();
	const { sidebar } = useLayout();
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const directoryRoute = useRoute('omnichannel-directory');

	const voipCallIcon = {
		title: !registered ? t('Enable') : t('Disable'),
		color: registered ? 'success' : undefined,
		icon: registered ? 'phone' : 'phone-disabled',
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
			loggerRef.current?.error(`handleAvailableStatusChange ${error}`);
		}
	});

	const onUnregistrationError = useCallback((): void => {
		loggerRef.current?.error('onUnregistrationError');
		voipLib?.removeListener(VoipEvents.unregistrationerror, onUnregistrationError);
	}, [voipLib]);

	const onUnregistered = useCallback((): void => {
		loggerRef.current?.debug('unRegistered');
		setRegistered(!registered);
		voipLib?.removeListener(VoipEvents.unregistered, onUnregistered);
		voipLib?.removeListener(VoipEvents.registrationerror, onUnregistrationError);
	}, [onUnregistrationError, registered, voipLib]);

	const onRegistrationError = useCallback((): void => {
		loggerRef.current?.error('onRegistrationError');
		voipLib?.removeListener(VoipEvents.registrationerror, onRegistrationError);
	}, [voipLib]);

	const onRegistered = useCallback((): void => {
		loggerRef.current?.debug('onRegistered');
		setRegistered(!registered);
		voipLib?.removeListener(VoipEvents.registered, onRegistered);
		voipLib?.removeListener(VoipEvents.registrationerror, onRegistrationError);
	}, [onRegistrationError, registered, voipLib]);

	const handleVoipCallStatusChange = useCallback(() => {
		// TODO: backend set voip call status
		if (voipLibIsReady && voipCallAvailable) {
			if (!registered) {
				voipLib?.setListener(VoipEvents.registered, onRegistered);
				voipLib?.setListener(VoipEvents.registrationerror, onRegistrationError);
				voipLib?.registerEndpoint();
			} else {
				voipLib?.setListener(VoipEvents.unregistered, onUnregistered);
				voipLib?.setListener(VoipEvents.unregistrationerror, onUnregistrationError);
				voipLib?.unregisterEndpoint();
			}
		}
	}, [
		voipLibIsReady,
		voipCallAvailable,
		registered,
		voipLib,
		onRegistered,
		onRegistrationError,
		onUnregistered,
		onUnregistrationError,
	]);

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
				<Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} />
				<Sidebar.TopBar.Action {...availableIcon} onClick={handleAvailableStatusChange} />
				{hasPermission(['view-omnichannel-contact-center']) && (
					<Sidebar.TopBar.Action {...directoryIcon} onClick={handleDirectory} />
				)}{' '}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
