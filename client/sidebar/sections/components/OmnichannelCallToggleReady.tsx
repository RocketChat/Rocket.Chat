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
	} as const;
	const voipClient = useCallClient();

	useEffect(() => {
		let agentEnabled = false;
		const state = voipClient.getRegistrarState();
		if (state === 'registered') {
			agentEnabled = true;
		}
		setAgentEnabled(agentEnabled);
		setRegistered(agentEnabled);
	}, [voipClient]);
	// TODO: move registration flow to context provider
	const handleVoipCallStatusChange = useMutableCallback((): void => {
		const { state } = voipClient.callerInfo;

		if (['IN_CALL', 'ON_HOLD'].includes(state)) {
			// Any of the 2 states means the user is already talking
			// So if the caller info is any of those, we will prevent status change
			return;
		}
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
		setRegistered(false);
		setAgentEnabled(false);
	});

	const onUnregistered = useMutableCallback((): void => {
		setRegistered(!registered);
	});

	const onRegistrationError = useMutableCallback((): void => {
		setRegistered(false);
		setAgentEnabled(false);
	});

	const onRegistered = useMutableCallback((): void => {
		setRegistered(!registered);
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
