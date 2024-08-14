import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Device, IExperimentalHTMLAudioElement } from '@rocket.chat/ui-contexts';
import { useSetInputMediaDevice, useSetOutputMediaDevice, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { VoiceCallContextValue } from '../contexts/VoiceCallContext';
import { VoiceCallContext } from '../contexts/VoiceCallContext';
import { useVoiceCallClient } from '../hooks/useVoiceCallClient';
import { useVoipSounds } from './OmnichannelCallProvider/hooks/useVoipSounds';

const VoiceCallProvider = ({ children }: { children: ReactNode }) => {
	// Settings
	const isVoipEnabled = useSetting<boolean>('VoIP_TeamCollab_Enabled') || false;
	const [isLocalRegistered, setStorageRegistered] = useLocalStorage('voice-call-registered', true);

	// Hooks
	const voipSounds = useVoipSounds();
	const { voipClient, error } = useVoiceCallClient({ autoRegister: isLocalRegistered });
	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	// Refs
	const remoteAudioMediaRef = useRef<IExperimentalHTMLAudioElement>(null);

	useEffect(() => {
		if (!voipClient) {
			return;
		}

		const onCallEstablished = async (): Promise<void> => {
			voipSounds.stopAll();

			if (!voipClient) {
				return;
			}

			if (voipClient.isCallee()) {
				return;
			}

			if (!remoteAudioMediaRef.current) {
				return;
			}

			voipClient.switchMediaRenderer({ remoteMediaElement: remoteAudioMediaRef.current });
		};

		const onNetworkDisconnected = (): void => {
			if (voipClient.isOngoing()) {
				voipClient.endCall();
			}
		};

		const onOutgoingCallRinging = (): void => {
			voipSounds.play('outbound-call-ringing');
		};

		const onIncomingCallRinging = (): void => {
			voipSounds.play('telephone');
		};

		const onCallTerminated = (): void => {
			voipSounds.play('call-ended', false);
			voipSounds.stopAll();
		};

		const onRegistrationError = () => {
			setStorageRegistered(false);
			dispatchToastMessage({ type: 'error', message: t('Voice_calling_registration_failed') });
		};

		const onRegistered = () => {
			setStorageRegistered(true);
		};

		const onUnregister = () => {
			setStorageRegistered(false);
		};

		voipClient.on('incomingcall', onIncomingCallRinging);
		voipClient.on('outgoingcall', onOutgoingCallRinging);
		voipClient.on('callestablished', onCallEstablished);
		voipClient.on('callterminated', onCallTerminated);
		voipClient.on('registrationerror', onRegistrationError);
		voipClient.on('registered', onRegistered);
		voipClient.on('unregistered', onUnregister);
		voipClient.networkEmitter.on('disconnected', onNetworkDisconnected);
		voipClient.networkEmitter.on('connectionerror', onNetworkDisconnected);
		voipClient.networkEmitter.on('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipClient.off('incomingcall', onIncomingCallRinging);
			voipClient.off('outgoingcall', onOutgoingCallRinging);
			voipClient.off('callestablished', onCallEstablished);
			voipClient.off('callterminated', onCallTerminated);
			voipClient.off('registrationerror', onRegistrationError);
			voipClient.off('registered', onRegistered);
			voipClient.off('unregistered', onUnregister);
			voipClient.networkEmitter.off('disconnected', onNetworkDisconnected);
			voipClient.networkEmitter.off('connectionerror', onNetworkDisconnected);
			voipClient.networkEmitter.off('localnetworkoffline', onNetworkDisconnected);
		};
	}, [dispatchToastMessage, setStorageRegistered, t, voipClient, voipSounds]);

	const changeAudioOutputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!remoteAudioMediaRef.current) {
			return;
		}

		setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: remoteAudioMediaRef.current });
	});

	const changeAudioInputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!voipClient) {
			return;
		}

		await voipClient.changeAudioInputDevice({ audio: { deviceId: { exact: selectedAudioDevice.id } } });
		setInputMediaDevice(selectedAudioDevice);
	});

	const contextValue = useMemo<VoiceCallContextValue>(() => {
		if (!isVoipEnabled) {
			return {
				isEnabled: false,
				voipClient: null,
				error: null,
				changeAudioInputDevice,
				changeAudioOutputDevice,
			};
		}

		if (!voipClient || error) {
			return {
				isEnabled: true,
				voipClient: null,
				error,
				changeAudioInputDevice,
				changeAudioOutputDevice,
			};
		}

		return {
			isEnabled: true,
			voipClient,

			changeAudioInputDevice,
			changeAudioOutputDevice,
		};
	}, [voipClient, isVoipEnabled, error, changeAudioInputDevice, changeAudioOutputDevice]);

	return (
		<VoiceCallContext.Provider value={contextValue}>
			{children}
			{contextValue.isEnabled &&
				createPortal(
					<audio ref={remoteAudioMediaRef}>
						<track kind='captions' />
					</audio>,
					document.body,
				)}
		</VoiceCallContext.Provider>
	);
};

export default VoiceCallProvider;
