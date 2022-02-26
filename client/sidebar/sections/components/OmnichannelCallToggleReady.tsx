import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useEffect, useState, useRef } from 'react';

import { useCallClient, useIsAgentRegistered } from '../../../contexts/CallContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const ref = useRef({
		lastRegisterStatus: false,
	});
	const changeAgentStatus = useMethod('livechat:changeVoipStatus');

	const [agentEnabled, setAgentEnabled] = useState(useIsAgentRegistered); // TODO: get from AgentInfo
	const t = useTranslation();
	const [registered, setRegistered] = useState(ref.current.lastRegisterStatus);

	const voipCallIcon = {
		title: !registered ? t('Enable') : t('Disable'),
		color: registered ? 'success' : undefined,
		icon: registered ? 'phone' : 'phone-disabled',
	} as const;
	const voipClient = useCallClient();

	// TODO: move registration flow to context provider
	const handleVoipCallStatusChange = useMutableCallback((): void => {
		// TODO: backend set voip call status
		// voipClient.setVoipCallStatus(!registered);
		if (agentEnabled) {
			setAgentEnabled(false);
			changeAgentStatus(false);
			voipClient.unregister();
			return;
		}
		changeAgentStatus(true);
		setAgentEnabled(true);
		voipClient.register();
	});

	const onUnregistrationError = useMutableCallback((): void => {
		voipClient.off('unregistrationerror', onUnregistrationError);
	});

	const onUnregistered = useMutableCallback((): void => {
		setRegistered(!registered);
		ref.current.lastRegisterStatus = registered;
		voipClient.off('unregistered', onUnregistered);
		voipClient.off('registrationerror', onUnregistrationError);
	});

	const onRegistrationError = useMutableCallback((): void => {
		voipClient.off('registrationerror', onRegistrationError);
	});

	const onRegistered = useMutableCallback((): void => {
		setRegistered(!registered);
		ref.current.lastRegisterStatus = registered;
		voipClient.off('registered', onRegistered);
		voipClient.off('registrationerror', onRegistrationError);
	});

	useEffect(() => {
		if (!voipClient) {
			return;
		}
		voipClient.on('registered', onRegistered);
		voipClient.on('registrationerror', onRegistrationError);
		voipClient.on('unregistered', onUnregistered);
		voipClient.on('unregistrationerror', onUnregistrationError);

		return (): void => {
			voipClient.off('registered', onRegistered);
			voipClient.off('registrationerror', onRegistrationError);
			voipClient.off('unregistered', onUnregistered);
			voipClient.off('unregistrationerror', onUnregistrationError);
		};
	}, [onRegistered, onRegistrationError, onUnregistered, onUnregistrationError, voipClient]);

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} />;
};
