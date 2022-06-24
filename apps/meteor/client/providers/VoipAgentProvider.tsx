import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useCallActions, useCallClient } from '../contexts/CallContext';
import { VoIPAgentContext } from '../contexts/VoIPAgentContext';

const VoIPAgentProvider: FC = ({ children }) => {
	const [agentEnabled, setAgentEnabled] = useState(false);
	const [registered, setRegistered] = useState(false);
	const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
	const [voipButtonEnabled, setVoipButtonEnabled] = useState(false);
	const callActions = useCallActions();

	const voipClient = useCallClient();
	const registerState = useMemo(() => voipClient.getRegistrarState(), [voipClient]);

	const toggleRegistered = useCallback((): void => {
		setRegistered((registered) => !registered);
	}, []);

	const toggleRegistrationError = useCallback((): void => {
		setRegistered(false);
		setAgentEnabled(false);
	}, []);

	const onNetworkConnected = useCallback((): void => {
		setVoipButtonEnabled(['IN_CALL', 'ON_HOLD'].includes(voipClient.callerInfo.state));
		setNetworkStatus('online');
	}, [setNetworkStatus, setVoipButtonEnabled, voipClient.callerInfo.state]);

	const onNetworkDisconnected = useCallback((): void => {
		setVoipButtonEnabled(true);
		setNetworkStatus('offline');
	}, [setNetworkStatus, setVoipButtonEnabled]);

	useEffect(() => {
		if (!agentEnabled) {
			return;
		}

		voipClient.register();

		return (): void => voipClient.unregister();
	}, [agentEnabled, voipClient]);

	useEffect(() => {
		setVoipButtonEnabled(['IN_CALL', 'ON_HOLD'].includes(voipClient.callerInfo.state));
	}, [setVoipButtonEnabled, voipClient.callerInfo.state]);

	useEffect(() => {
		setRegistered(registerState === 'registered');
	}, [registerState]);

	useEffect(() => {
		if (voipButtonEnabled) {
			return;
		}

		voipClient.callerInfo.state === 'OFFER_RECEIVED' && callActions.reject();
	}, [callActions, voipButtonEnabled, voipClient.callerInfo.state]);

	useEffect(() => {
		voipClient.on('registered', toggleRegistered);
		voipClient.on('unregistered', toggleRegistered);
		voipClient.on('registrationerror', toggleRegistrationError);
		voipClient.on('unregistrationerror', toggleRegistrationError);
		voipClient.onNetworkEvent('connected', onNetworkConnected);
		voipClient.onNetworkEvent('disconnected', onNetworkDisconnected);
		voipClient.onNetworkEvent('connectionerror', onNetworkDisconnected);
		voipClient.onNetworkEvent('localnetworkonline', onNetworkConnected);
		voipClient.onNetworkEvent('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipClient.off('registered', toggleRegistered);
			voipClient.off('unregistered', toggleRegistered);
			voipClient.off('registrationerror', toggleRegistrationError);
			voipClient.off('unregistrationerror', toggleRegistrationError);
			voipClient.offNetworkEvent('connected', onNetworkConnected);
			voipClient.offNetworkEvent('disconnected', onNetworkDisconnected);
			voipClient.offNetworkEvent('connectionerror', onNetworkDisconnected);
			voipClient.offNetworkEvent('localnetworkonline', onNetworkConnected);
			voipClient.offNetworkEvent('localnetworkoffline', onNetworkDisconnected);
		};
	}, [voipClient, onNetworkConnected, onNetworkDisconnected, toggleRegistered, toggleRegistrationError]);

	return (
		<VoIPAgentContext.Provider
			children={children}
			value={{
				agentEnabled,
				registered,
				networkStatus,
				voipButtonEnabled,
				setAgentEnabled,
				setRegistered,
				setNetworkStatus,
				setVoipButtonEnabled,
			}}
		/>
	);
};

export default VoIPAgentProvider;
