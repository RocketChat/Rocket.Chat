import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useState } from 'react';

import { useCallClient, useCallerInfo, useCallActions } from '../../../contexts/CallContext';

type NetworkState = 'online' | 'offline';
export const OmnichannelCallToggleReady = (): ReactElement => {
	const [agentEnabled, setAgentEnabled] = useState(false); // TODO: get from AgentInfo
	const t = useTranslation();
	const [registered, setRegistered] = useState(false);
	const voipClient = useCallClient();
	const [disableButtonClick, setDisableButtonClick] = useState(false);
	const [networkStatus, setNetworkStatus] = useState<NetworkState>('online');
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();

	const getTooltip = (): string => {
		if (networkStatus === 'offline') {
			return t('Signaling_connection_disconnected');
		}
		if (!registered) {
			return t('Enable');
		}
		if (!disableButtonClick) {
			// Color for this state still not defined
			return t('Disable');
		}

		return t('Cannot_disable_while_on_call');
	};

	const getIcon = (): 'phone-issue' | 'phone' | 'phone-disabled' => {
		if (networkStatus === 'offline') {
			return 'phone-issue';
		}
		return registered ? 'phone' : 'phone-disabled';
	};

	const getColor = (): 'warning' | 'success' | undefined => {
		if (networkStatus === 'offline') {
			return 'warning';
		}
		return registered ? 'success' : undefined;
	};

	const voipCallIcon = {
		title: getTooltip(),
		color: getColor(),
		icon: getIcon(),
	} as const;

	useEffect(() => {
		// Any of the 2 states means the user is already talking
		setDisableButtonClick(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state));
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
		if (disableButtonClick) {
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

	const onNetworkConnected = useMutableCallback((): void => {
		setDisableButtonClick(['IN_CALL', 'ON_HOLD'].includes(callerInfo.state));
		setNetworkStatus('online');
	});

	const onNetworkDisconnected = useMutableCallback((): void => {
		setDisableButtonClick(true);
		setNetworkStatus('offline');
	});

	useEffect(() => {
		if (!voipClient) {
			return;
		}
		voipClient.on('registered', onRegistered);
		voipClient.on('registrationerror', onRegistrationError);
		voipClient.on('unregistered', onUnregistered);
		voipClient.on('unregistrationerror', onUnregistrationError);
		voipClient.onNetworkEvent('connected', onNetworkConnected);
		voipClient.onNetworkEvent('disconnected', onNetworkDisconnected);
		voipClient.onNetworkEvent('connectionerror', onNetworkDisconnected);
		voipClient.onNetworkEvent('localnetworkonline', onNetworkConnected);
		voipClient.onNetworkEvent('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipClient.off('registered', onRegistered);
			voipClient.off('registrationerror', onRegistrationError);
			voipClient.off('unregistered', onUnregistered);
			voipClient.off('unregistrationerror', onUnregistrationError);
			voipClient.offNetworkEvent('connected', onNetworkConnected);
			voipClient.offNetworkEvent('disconnected', onNetworkDisconnected);
			voipClient.offNetworkEvent('connectionerror', onNetworkDisconnected);
			voipClient.offNetworkEvent('localnetworkonline', onNetworkConnected);
			voipClient.offNetworkEvent('localnetworkoffline', onNetworkDisconnected);
		};
	}, [onRegistered, onRegistrationError, onUnregistered, onUnregistrationError, voipClient, onNetworkConnected, onNetworkDisconnected]);

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} disabled={disableButtonClick} />;
};
