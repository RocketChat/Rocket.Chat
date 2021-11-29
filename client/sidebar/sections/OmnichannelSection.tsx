import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement, useState, useRef, useEffect, useMemo } from 'react';

import { ClientLogger } from '../../../lib/ClientLogger';
import { usePermission } from '../../contexts/AuthorizationContext';
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
	const hasPermission = usePermission('view-omnichannel-contact-center');
	const voipCallAvailable = useState(useOmnichannelVoipCallAvailable());
	const [registered, setRegistered] = useState(false);
	const voipLibIsReady = useIsVoipLibReady();
	const voipLib = useVoipUser();
	const agentAvailable = useOmnichannelAgentAvailable();

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();

	const { sidebar } = useLayout();
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

	const {
		onUnregistrationError,
		onUnregistered,
		onRegistrationError,
		onRegistered,
		handleVoipCallStatusChange,
	} = useMemo(() => {
		if (!voipLib) {
			return {
				onUnregistrationError: (): void => undefined,
				onUnregistered: (): void => undefined,
				onRegistrationError: (): void => undefined,
				onRegistered: (): void => undefined,
				handleVoipCallStatusChange: (): void => undefined,
			};
		}

		const onUnregistrationError = (): void => {
			loggerRef.current?.error('onUnregistrationError');
			voipLib.off('unregistrationerror', onUnregistrationError);
		};

		const onUnregistered = (): void => {
			loggerRef.current?.debug('unRegistered');
			setRegistered(!registered);
			voipLib.off('unregistered', onUnregistered);
			voipLib.off('registrationerror', onUnregistrationError);
		};

		const onRegistrationError = (): void => {
			loggerRef.current?.error('onRegistrationError');
			voipLib.off('registrationerror', onRegistrationError);
		};

		const onRegistered = (): void => {
			loggerRef.current?.debug('onRegistered');
			setRegistered(!registered);
			voipLib.off('registered', onRegistered);
			voipLib.off('registrationerror', onRegistrationError);
		};

		const handleVoipCallStatusChange = (): void => {
			// TODO: backend set voip call status
			if (voipLibIsReady && voipCallAvailable) {
				if (registered) {
					voipLib.unregister();
					return;
				}
				voipLib.register();
			}
		};

		return {
			onUnregistrationError,
			onUnregistered,
			onRegistrationError,
			onRegistered,
			handleVoipCallStatusChange,
		};
	}, [registered, voipCallAvailable, voipLib, voipLibIsReady]);

	useEffect(() => {
		if (!voipLib) {
			return;
		}
		voipLib.on('registered', onRegistered);
		voipLib.on('registrationerror', onRegistrationError);
		voipLib.on('unregistered', onUnregistered);
		voipLib.on('unregistrationerror', onUnregistrationError);

		return (): void => {
			voipLib.off('registered', onRegistered);
			voipLib.off('registrationerror', onRegistrationError);
			voipLib.off('unregistered', onUnregistered);
			voipLib.off('unregistrationerror', onUnregistrationError);
		};
	}, [onRegistered, onRegistrationError, onUnregistered, onUnregistrationError, voipLib]);

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
				{hasPermission && <Sidebar.TopBar.Action {...directoryIcon} onClick={handleDirectory} />}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
