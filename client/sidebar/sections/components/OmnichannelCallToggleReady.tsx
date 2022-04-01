import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useEffect, useState } from 'react';

import { useCallClient, useCallerInfo, useCallActions } from '../../../contexts/CallContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const [agentEnabled, setAgentEnabled] = useState(false); // TODO: get from AgentInfo
	const t = useTranslation();
	const [registered, setRegistered] = useState(false);
	const voipClient = useCallClient();
	const [onCall, setOnCall] = useState(false);
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();

	const getTooltip = (): string => {
		if (!registered) {
			return t('Enable');
		}
		if (!onCall) {
			// Color for this state still not defined
			return t('Disable');
		}

		return t('Cannot_disable_while_on_call');
	};

	const voipCallIcon = {
		title: getTooltip(),
		color: registered ? 'success' : undefined,
		icon: registered ? 'phone' : 'phone-disabled',
	} as const;

	useEffect(() => {
		// Any of the 2 states means the user is already talking
		setOnCall(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state));
	}, [callerInfo]);

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
		if (onCall) {
			return;
		}
		// TODO: backend set voip call status
		// voipClient.setVoipCallStatus(!registered);
		if (agentEnabled) {
			callerInfo.state === 'OFFER_RECEIVED' && callActions.reject();
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

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} disabled={onCall} />;
};
