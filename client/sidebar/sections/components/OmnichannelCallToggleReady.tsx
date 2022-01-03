import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useEffect, useState } from 'react';

import { useCallClient } from '../../../contexts/CallContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const [agentEnabled, setAgentEnabled] = useState(false); // TODO: get from AgentInfo
	const t = useTranslation();
	const [registered, setRegistered] = useState(false);

	const voipCallIcon = {
		title: !registered ? t('Enable') : t('Disable'),
		color: registered ? 'success' : undefined,
		icon: registered ? 'phone' : 'phone-disabled',
	};
	const voipClient = useCallClient();

	// TODO: move registration flow to context provider
	const handleVoipCallStatusChange = useMutableCallback((): void => {
		// TODO: backend set voip call status
		// voipClient.setVoipCallStatus(!registered);
		if (agentEnabled) {
			setAgentEnabled(false);
			voipClient.unregister();
			return;
		}
		setAgentEnabled(true);
		voipClient.register();
	});

	const onUnregistrationError = useMutableCallback((): void => {
		voipClient.off('unregistrationerror', onUnregistrationError);
	});

	const onUnregistered = useMutableCallback((): void => {
		setRegistered(!registered);
		voipClient.off('unregistered', onUnregistered);
		voipClient.off('registrationerror', onUnregistrationError);
	});

	const onRegistrationError = useMutableCallback((): void => {
		voipClient.off('registrationerror', onRegistrationError);
	});

	const onRegistered = useMutableCallback((): void => {
		setRegistered(!registered);
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
