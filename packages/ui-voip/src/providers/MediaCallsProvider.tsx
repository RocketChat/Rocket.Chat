import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
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

import { VoipPopupDraggable } from '../components';
import VoipPopupPortal from '../components/VoipPopupPortal';
import type { VoipContextValue } from '../contexts/VoipContext';
import { VoipContext } from '../contexts/VoipContext';
import { useIceServers } from '../hooks/useIceServers';
import { useMediaCallsClient } from '../hooks/useMediaCallsClient';

const MediaCallsProvider = ({ children }: { children: ReactNode }) => {
	// Settings
	const isVoipSettingEnabled = useSetting('VoIP_TeamCollab_Enabled', false);
	const canViewVoipRegistrationInfo = usePermission('view-user-voip-extension');
	const isVoipEnabled = isVoipSettingEnabled && canViewVoipRegistrationInfo;
	const iceServers = useIceServers();

	// Hooks
	const { t } = useTranslation();
	const { voipSounds } = useCustomSound();
	const { mediaCallsClient, error } = useMediaCallsClient({
		enabled: isVoipEnabled,
		iceServers,
	});
	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();
	const dispatchToastMessage = useToastMessageDispatch();

	// Refs
	const remoteAudioMediaRef = useCallback(
		(node: HTMLMediaElement | null) => {
			mediaCallsClient?.switchAudioElement(node);
		},
		[mediaCallsClient],
	);

	useEffect(() => {
		if (!mediaCallsClient) {
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
			if (mediaCallsClient.isOngoing()) {
				mediaCallsClient.endCall();
			}
		};

		const onOutgoingCallRinging = (): void => {
			// mediaCallsClient 'outgoingcall' event is emitted when the call is establishing
			// and that event is also emitted when the call is accepted
			// to avoid disrupting the mediaCallsClient flow, we check if the call is outgoing here.
			if (mediaCallsClient.isOutgoing()) {
				voipSounds.playDialer();
			}
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

		const onIncomingCallError = (reason: string) => {
			console.error('incoming call canceled', reason);
			if (reason === 'USER_NOT_REGISTERED') {
				dispatchToastMessage({ type: 'error', message: t('Incoming_voice_call_canceled_user_not_registered') });
				return;
			}

			dispatchToastMessage({ type: 'error', message: t('Incoming_voice_call_canceled_suddenly') });
		};

		mediaCallsClient.on('incomingcall', onIncomingCallRinging);
		mediaCallsClient.on('outgoingcall', onOutgoingCallRinging);
		mediaCallsClient.on('callestablished', onCallEstablished);
		mediaCallsClient.on('callterminated', onCallTerminated);
		mediaCallsClient.on('incomingcallerror', onIncomingCallError);
		mediaCallsClient.networkEmitter.on('disconnected', onNetworkDisconnected);
		mediaCallsClient.networkEmitter.on('connectionerror', onNetworkDisconnected);
		mediaCallsClient.networkEmitter.on('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipSounds.stopCallEnded();
			mediaCallsClient.off('incomingcall', onIncomingCallRinging);
			mediaCallsClient.off('outgoingcall', onOutgoingCallRinging);
			mediaCallsClient.off('callestablished', onCallEstablished);
			mediaCallsClient.off('callterminated', onCallTerminated);
			mediaCallsClient.off('incomingcallerror', onIncomingCallError);
			mediaCallsClient.networkEmitter.off('disconnected', onNetworkDisconnected);
			mediaCallsClient.networkEmitter.off('connectionerror', onNetworkDisconnected);
			mediaCallsClient.networkEmitter.off('localnetworkoffline', onNetworkDisconnected);
			window.removeEventListener('beforeunload', onBeforeUnload);
		};
	}, [dispatchToastMessage, t, mediaCallsClient, voipSounds]);

	const changeAudioOutputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		const element = mediaCallsClient?.getAudioElement();
		if (!element) {
			console.warn(`Failed to change audio output device: missing audio element reference.`);
			return;
		}

		setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: element });
	});

	const changeAudioInputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!mediaCallsClient) {
			return;
		}

		await mediaCallsClient.changeAudioInputDevice({ audio: { deviceId: { exact: selectedAudioDevice.id } } });
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

		if (!mediaCallsClient || error) {
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
			voipClient: mediaCallsClient as any,

			changeAudioInputDevice,
			changeAudioOutputDevice,
		};
	}, [mediaCallsClient, isVoipEnabled, error, changeAudioInputDevice, changeAudioOutputDevice]);

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
				<VoipPopupDraggable initialPosition={{ bottom: 132, right: 24 }} />
			</VoipPopupPortal>
		</VoipContext.Provider>
	);
};

export default MediaCallsProvider;
