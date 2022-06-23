import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useEffect, useMemo } from 'react';

import { useCallActions, useCallClient } from '../../../contexts/CallContext';
import { useVoipAgent } from '../hooks/useVoipAgent';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const t = useTranslation();

	const {
		agentEnabled,
		networkStatus,
		registered,
		voipButtonEnabled,
		setAgentEnabled,
		setRegistered,
		setNetworkStatus,
		setVoipButtonEnabled,
	} = useVoipAgent();
	const voipClient = useCallClient();
	const callActions = useCallActions();

	const registerState = useMemo(() => voipClient.getRegisterState(), [voipClient]);

	const toogleRegistered = useMutableCallback((): void => {
		setRegistered(!registered);
	});

	const toogleRegistrationError = useCallback((): void => {
		setRegistered(false);
		setAgentEnabled(false);
	}, [setAgentEnabled, setRegistered]);

	const onNetworkConnected = useCallback((): void => {
		setVoipButtonEnabled(['IN_CALL', 'ON_HOLD'].includes(voipClient.callerInfo.state));
		setNetworkStatus('online');
	}, [setNetworkStatus, setVoipButtonEnabled, voipClient.callerInfo.state]);

	const onNetworkDisconnected = useCallback((): void => {
		setVoipButtonEnabled(true);
		setNetworkStatus('offline');
	}, [setNetworkStatus, setVoipButtonEnabled]);

	const onClickVoipButton = useCallback((): void => {
		if (voipButtonEnabled) {
			return;
		}

		setAgentEnabled(!agentEnabled);

		voipClient.callerInfo.state === 'OFFER_RECEIVED' && callActions.reject();
	}, [agentEnabled, callActions, setAgentEnabled, voipButtonEnabled, voipClient.callerInfo.state]);

	useEffect(() => {
		if (!agentEnabled) {
			voipClient.register();
		} else {
			voipClient.unregister();
		}
	}, [agentEnabled, voipClient]);

	useEffect(() => {
		setVoipButtonEnabled(['IN_CALL', 'ON_HOLD'].includes(voipClient.callerInfo.state));
	}, [setVoipButtonEnabled, voipClient.callerInfo.state]);

	useEffect(() => {
		setRegistered(registerState === 'registered');
	}, [registerState, setRegistered]);

	useEffect(() => {
		voipClient.on('registered', toogleRegistered);
		voipClient.on('unregistered', toogleRegistered);
		voipClient.on('registrationerror', toogleRegistrationError);
		voipClient.on('unregistrationerror', toogleRegistrationError);
		voipClient.onNetworkEvent('connected', onNetworkConnected);
		voipClient.onNetworkEvent('disconnected', onNetworkDisconnected);
		voipClient.onNetworkEvent('connectionerror', onNetworkDisconnected);
		voipClient.onNetworkEvent('localnetworkonline', onNetworkConnected);
		voipClient.onNetworkEvent('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipClient.off('registered', toogleRegistered);
			voipClient.off('unregistered', toogleRegistered);
			voipClient.off('registrationerror', toogleRegistrationError);
			voipClient.off('unregistrationerror', toogleRegistrationError);
			voipClient.offNetworkEvent('connected', onNetworkConnected);
			voipClient.offNetworkEvent('disconnected', onNetworkDisconnected);
			voipClient.offNetworkEvent('connectionerror', onNetworkDisconnected);
			voipClient.offNetworkEvent('localnetworkonline', onNetworkConnected);
			voipClient.offNetworkEvent('localnetworkoffline', onNetworkDisconnected);
		};
	}, [voipClient, onNetworkConnected, onNetworkDisconnected, toogleRegistered, toogleRegistrationError]);

	const getTitle = (): string => {
		if (networkStatus === 'offline') {
			return t('Signaling_connection_disconnected');
		}
		if (registered) {
			return t('Enable');
		}
		if (!voipButtonEnabled) {
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
		title: getTitle(),
		icon: getIcon(),
		color: getColor(),
	};

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={onClickVoipButton} disabled={voipButtonEnabled} />;
};
