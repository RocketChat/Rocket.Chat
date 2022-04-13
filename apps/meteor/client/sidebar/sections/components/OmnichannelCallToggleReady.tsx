import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useEffect, useState } from 'react';

import { useCallClient, useCallerInfo } from '../../../contexts/CallContext';
import { useTranslation } from '../../../contexts/TranslationContext';

type OmnichannellCallToggleState =
	| 'init'
	| 'registered'
	| 'unregistered'
	| 'oncall'
	| 'networkerror'
	| 'networkdisconnected'
	| 'networkconnected'
	| 'nonetwork';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const [agentEnabled, setAgentEnabled] = useState(false); // TODO: get from AgentInfo
	const t = useTranslation();
	const [currentState, setCurrentState] = useState<OmnichannellCallToggleState>('init');
	// const [registered, setRegistered] = useState(false);
	const voipClient = useCallClient();
	const [onCall, setOnCall] = useState(false);
	const [disablePhoneButton, setDisablePhoneButton] = useState(false);
	const callerInfo = useCallerInfo();

	const updateState = useMutableCallback((): void => {
		let agentEnabled = false;
		const state = voipClient.getRegistrarState();
		if (state === 'registered') {
			agentEnabled = true;
			setCurrentState('registered');
		} else {
			setCurrentState('unregistered');
		}
		setAgentEnabled(agentEnabled);
	});

	const getTooltip = (): string => {
		switch (currentState) {
			case 'registered':
				return t('Disable');
			case 'oncall':
				return t('Cannot_disable_while_on_call');
			case 'networkerror':
				return t('Signalling_connection_error');
			case 'networkdisconnected':
				return t('Signalling_connection_disconnected');
			case 'nonetwork':
				return t('No_network');
			case 'unregistered':
				return t('Enable');
		}
		return t('Error');
	};

	const voipCallIcon = {
		title: getTooltip(),
		color: currentState === 'registered' ? 'success' : undefined,
		icon: currentState === 'registered' ? 'phone' : 'phone-disabled',
	} as const;

	useEffect(() => {
		// Any of the 2 states means the user is already talking
		setOnCall(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state));
	}, [callerInfo]);

	useEffect(() => {
		updateState();
	}, [updateState]);

	// TODO: move registration flow to context provider
	const handleVoipCallStatusChange = useMutableCallback((): void => {
		if (onCall) {
			return;
		}
		// TODO: backend set voip call status
		if (agentEnabled) {
			setAgentEnabled(false);
			voipClient.unregister();
			return;
		}
		setAgentEnabled(true);
		voipClient.register();
	});

	const onUnregistrationError = useMutableCallback((): void => {
		setCurrentState('unregistered');
		setAgentEnabled(false);
	});

	const onUnregistered = useMutableCallback((): void => {
		setCurrentState('unregistered');
	});

	const onRegistrationError = useMutableCallback((): void => {
		setCurrentState('unregistered');
		setAgentEnabled(false);
	});

	const onRegistered = useMutableCallback((): void => {
		setCurrentState('registered');
	});

	const onConnected = useMutableCallback((): void => {
		setCurrentState('init');
		setDisablePhoneButton(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state) || false);
		updateState();
	});

	const onDisconnected = useMutableCallback((): void => {
		setCurrentState('networkdisconnected');
		setDisablePhoneButton(true);
		setAgentEnabled(true);
	});

	const onConnectionError = useMutableCallback((): void => {
		setCurrentState('networkerror');
		setDisablePhoneButton(true);
		setAgentEnabled(false);
	});

	const localNetworkOnline = useMutableCallback((): void => {
		setCurrentState('networkconnected');
		setDisablePhoneButton(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state) || false);
		setAgentEnabled(true);
	});

	const localNetworkOffline = useMutableCallback((): void => {
		setCurrentState('nonetwork');
		setAgentEnabled(false);
		setDisablePhoneButton(true);
	});

	useEffect(() => {
		if (!voipClient) {
			return;
		}
		voipClient.on('registered', onRegistered);
		voipClient.on('registrationerror', onRegistrationError);
		voipClient.on('unregistered', onUnregistered);
		voipClient.on('unregistrationerror', onUnregistrationError);
		voipClient.onNetworkEvent('connected', onConnected);
		voipClient.onNetworkEvent('disconnected', onDisconnected);
		voipClient.onNetworkEvent('connectionerror', onConnectionError);
		voipClient.onNetworkEvent('localnetworkonline', localNetworkOnline);
		voipClient.onNetworkEvent('localnetworkoffline', localNetworkOffline);

		return (): void => {
			voipClient.off('registered', onRegistered);
			voipClient.off('registrationerror', onRegistrationError);
			voipClient.off('unregistered', onUnregistered);
			voipClient.off('unregistrationerror', onUnregistrationError);
			voipClient.offNetworkEvent('connected', onConnected);
			voipClient.offNetworkEvent('disconnected', onDisconnected);
			voipClient.offNetworkEvent('connectionerror', onConnectionError);
			voipClient.offNetworkEvent('localnetworkonline', localNetworkOnline);
			voipClient.offNetworkEvent('localnetworkoffline', localNetworkOffline);
		};
	}, [
		localNetworkOnline,
		localNetworkOffline,
		onConnectionError,
		onDisconnected,
		onRegistered,
		onRegistrationError,
		onUnregistered,
		onUnregistrationError,
		voipClient,
		onConnected,
	]);

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} disabled={disablePhoneButton} />;
};
