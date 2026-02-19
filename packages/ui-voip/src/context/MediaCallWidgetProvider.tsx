import { AnchorPortal, useGoToDirectMessage } from '@rocket.chat/ui-client';
import type { Device } from '@rocket.chat/ui-contexts';
import {
	useSetOutputMediaDevice,
	useSetInputMediaDevice,
	useSetModal,
	useSelectedDevices,
	useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaCallInstanceContext } from './MediaCallInstanceContext';
import MediaCallWidgetContext from './MediaCallWidgetContext';
import type { PeerInfo } from './definitions';
import { useCallSounds } from './useCallSounds';
import { useDesktopNotifications } from './useDesktopNotifications';
import { useMediaSession } from './useMediaSession';
import { useMediaSessionControls } from './useMediaSessionControls';
import { isValidTone, useTonePlayer } from './useTonePlayer';
import { useWidgetExternalControlSignalListener } from './useWidgetExternalControlSignalListener';
import { stopTracks, useDevicePermissionPrompt2, PermissionRequestCancelledCallRejectedError } from '../hooks/useDevicePermissionPrompt';
import { MediaCallWidget } from '../views';
import TransferModal from '../views/TransferModal';

type MediaCallWidgetProviderProps = {
	children?: ReactNode;
};

const MediaCallWidgetProvider = ({ children }: MediaCallWidgetProviderProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const { instance, audioElement, openRoomId } = useMediaCallInstanceContext();

	const { sessionState, toggleWidget, selectPeer } = useMediaSession(instance);
	const controls = useMediaSessionControls(instance);

	useDesktopNotifications(sessionState);

	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();

	const { audioInput, audioOutput } = useSelectedDevices() || {};

	const requestDevice = useDevicePermissionPrompt2();

	const onClickDirectMessage = useGoToDirectMessage(
		{ username: sessionState.peerInfo && 'username' in sessionState.peerInfo ? sessionState.peerInfo.username : undefined },
		openRoomId,
	);

	useEffect(() => {
		if (audioInput?.id && !sessionState.hidden) {
			void controls.changeDevice(audioInput.id);
		}
	}, [audioInput?.id, controls, sessionState.hidden]);

	useCallSounds(
		sessionState.hidden ? 'closed' : sessionState.state,
		useCallback(
			(callback) => {
				if (!instance) {
					return;
				}
				return instance.on('endedCall', () => {
					if (sessionState.hidden) {
						return;
					}
					callback();
				});
			},
			[instance, sessionState.hidden],
		),
	);

	const onMute = () => controls.toggleMute();
	const onHold = () => controls.toggleHold();

	const onCall = async () => {
		if (sessionState.state !== 'new') {
			console.error('Cannot start call in state', sessionState.state);
			return;
		}

		const { peerInfo } = sessionState;

		if (!peerInfo) {
			return;
		}

		try {
			const stream = await requestDevice({ actionType: 'outgoing' });
			stopTracks(stream);
		} catch (error) {
			console.error('Media Call - Error requesting device', error);
			return;
		}

		if ('userId' in peerInfo) {
			void controls.startCall(peerInfo.userId, 'user');
			return;
		}

		if ('number' in peerInfo) {
			void controls.startCall(peerInfo.number, 'sip');
			return;
		}

		throw new Error('MediaCall - New call - something went wrong when trying to call. PeerInfo is missing userId and/or number.');
	};

	const onAccept = async () => {
		if (sessionState.state !== 'ringing') {
			console.error('Cannot accept call in state', sessionState.state);
			return;
		}

		try {
			const stream = await requestDevice({ actionType: 'incoming' });
			stopTracks(stream);
		} catch (error) {
			if (error instanceof PermissionRequestCancelledCallRejectedError) {
				controls.endCall();
			}
			return;
		}

		void controls.acceptCall();
	};

	const onDeviceChange = (device: Device) => {
		const parameters = {
			actionType: 'device-change',
			constraints: {
				audio: {
					deviceId: {
						exact: device.id,
					},
				},
			},
		} as const;

		if (device.type === 'audiooutput') {
			if (!audioElement?.current) return;
			setOutputMediaDevice({ outputDevice: device, HTMLAudioElement: audioElement.current });
			return;
		}

		if (device.type === 'audioinput') {
			void requestDevice(parameters).then(async (stream) => {
				stopTracks(stream);
				setInputMediaDevice(device);
			});

			return;
		}

		console.error('Invalid device type', device.type);
	};

	const onForward = () => {
		const offCallback = instance?.once('endedCall', () => {
			setModal(null);
		});

		const onCancel = () => {
			offCallback?.();
			setModal(null);
		};

		const onConfirm = (kind: 'user' | 'sip', peer: { displayName: string; id: string }) => {
			offCallback?.();
			controls.forwardCall(kind, peer.id);
			setModal(null);
			dispatchToastMessage({ type: 'success', message: t('Call_transfered_to__name__', { name: peer.displayName }) });
		};

		setModal(<TransferModal onCancel={onCancel} onConfirm={onConfirm} />);
	};

	const playTone = useTonePlayer(audioOutput?.id);

	const onTone = (tone: string) => {
		controls.sendTone(tone);
		if (isValidTone(tone)) {
			playTone(tone);
		}
	};

	const onEndCall = () => {
		controls.endCall();
	};

	const onSelectPeer = (peerInfo: PeerInfo) => {
		selectPeer(peerInfo);
	};

	useWidgetExternalControlSignalListener(
		'toggleWidget',
		useCallback(
			({ peerInfo }) => {
				toggleWidget(peerInfo);
			},
			[toggleWidget],
		),
	);

	const contextValue = {
		sessionState,
		onClickDirectMessage,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onAccept,
		onSelectPeer,
	};

	return (
		<MediaCallWidgetContext.Provider value={contextValue}>
			<AnchorPortal id='rcx-media-call-widget-portal'>
				<MediaCallWidget />
			</AnchorPortal>
			{children}
		</MediaCallWidgetContext.Provider>
	);
};

export default MediaCallWidgetProvider;
