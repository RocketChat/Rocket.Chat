import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Device } from '@rocket.chat/ui-contexts';
import {
	useCustomSound,
	usePermission,
	useSetInputMediaDevice,
	useSetOutputMediaDevice,
	useSetting,
	useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import VoipPopup from '../components/VoipPopup';
import VoipPopupPortal from '../components/VoipPopupPortal';
import type { VoipContextValue } from '../contexts/VoipContext';
import { VoipContext } from '../contexts/VoipContext';
import { useVoipClient } from '../hooks/useVoipClient';

const VoipProvider = ({ children }: { children: ReactNode }) => {
	// Settings
	const isVoipSettingEnabled = useSetting('VoIP_TeamCollab_Enabled', false);
	const canViewVoipRegistrationInfo = usePermission('view-user-voip-extension');
	const isVoipEnabled = isVoipSettingEnabled && canViewVoipRegistrationInfo;

	const [isLocalRegistered, setStorageRegistered] = useLocalStorage('voip-registered', true);

	// Hooks
	const { t } = useTranslation();
	const { voipSounds } = useCustomSound();
	const { voipClient, error } = useVoipClient({
		enabled: isVoipEnabled,
		autoRegister: isLocalRegistered,
	});
	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();
	const dispatchToastMessage = useToastMessageDispatch();

	// Refs
	const remoteAudioMediaRef = useCallback(
		(node: HTMLMediaElement | null) => {
			voipClient?.switchAudioElement(node);
		},
		[voipClient],
	);

	useEffect(() => {
		if (!voipClient) {
			return;
		}

		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = true;
		};

		const onCallEstablished = async (): Promise<void> => {
			voipSounds.stopDialer();
			voipSounds.stopRinger();
			window.addEventListener('beforeunload', onBeforeUnload);
		};

		const onNetworkDisconnected = (): void => {
			if (voipClient.isOngoing()) {
				voipClient.endCall();
			}
		};

		const onOutgoingCallRinging = (): void => {
			voipSounds.playDialer();
		};

		const onIncomingCallRinging = (): void => {
			voipSounds.playRinger();
		};

		const onCallTerminated = (): void => {
			voipSounds.playCallEnded();
			voipSounds.stopDialer();
			voipSounds.stopRinger();
			window.removeEventListener('beforeunload', onBeforeUnload);
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
			voipSounds.stopCallEnded();
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
			window.removeEventListener('beforeunload', onBeforeUnload);
		};
	}, [dispatchToastMessage, setStorageRegistered, t, voipClient, voipSounds]);

	const changeAudioOutputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		const element = voipClient?.getAudioElement();
		if (!element) {
			console.warn(`Failed to change audio output device: missing audio element reference.`);
			return;
		}

		setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: element });
	});

	const changeAudioInputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!voipClient) {
			return;
		}

		await voipClient.changeAudioInputDevice({ audio: { deviceId: { exact: selectedAudioDevice.id } } });
		setInputMediaDevice(selectedAudioDevice);
	});

	const contextValue = useMemo<VoipContextValue>(() => {
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
		<VoipContext.Provider value={contextValue}>
			{children}
			{contextValue.isEnabled &&
				createPortal(
					<audio ref={remoteAudioMediaRef}>
						<track kind='captions' />
					</audio>,
					document.body,
				)}

			<VoipPopupPortal>
				<VoipPopup position={{ bottom: 132, right: 24 }} />
			</VoipPopupPortal>
		</VoipContext.Provider>
	);
};

export default VoipProvider;
