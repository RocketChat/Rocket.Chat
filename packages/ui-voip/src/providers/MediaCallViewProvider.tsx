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

import { useCallSounds } from './useCallSounds';
import { useDesktopNotifications } from './useDesktopNotifications';
import { useMediaSession } from './useMediaSession';
import { useMediaSessionControls } from './useMediaSessionControls';
import { useScreenShareStreams } from './useScreenShareStreams';
import { useWidgetExternalControlSignalListener } from './useWidgetExternalControlSignalListener';
import useWidgetPositionTracker from './useWidgetPositionTracker';
import { useMediaCallInstance } from '../context/MediaCallInstanceContext';
import MediaCallViewContext from '../context/MediaCallViewContext';
import type { PeerInfo } from '../context/definitions';
import { stopTracks, useDevicePermissionPrompt2, PermissionRequestCancelledCallRejectedError } from '../hooks/useDevicePermissionPrompt';
import { isValidTone, useTonePlayer } from '../hooks/useTonePlayer';
import { MediaCallWidget } from '../views';
import TransferModal from '../views/TransferModal';

type MediaCallViewProviderProps = {
	children?: ReactNode;
};

const MediaCallViewProvider = ({ children }: MediaCallViewProviderProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const { instance, audioElement, openRoomId } = useMediaCallInstance();

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

		controls.acceptCall();
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
			void requestDevice(parameters)
				.then(async (stream) => {
					stopTracks(stream);
					setInputMediaDevice(device);
				})
				.catch((error) => {
					console.error('Error changing device', error);
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

	const onToggleScreenSharing = () => {
		controls.toggleScreenSharing();
	};

	const streams = useScreenShareStreams(instance);

	useWidgetExternalControlSignalListener(
		'toggleWidget',
		useCallback(
			({ peerInfo }) => {
				toggleWidget(peerInfo);
			},
			[toggleWidget],
		),
	);

	const { onChangePosition, getRestorePosition } = useWidgetPositionTracker();

	useEffect(() => {
		return instance?.on('endedCall', () => {
			onChangePosition(null);
		});
	}, [instance, onChangePosition]);

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
		onToggleScreenSharing,
		streams,
		widgetPositionTracker: {
			onChangePosition,
			getRestorePosition,
		},
	};

	return (
		<MediaCallViewContext.Provider value={contextValue}>
			<AnchorPortal id='rcx-media-call-widget-portal'>
				<MediaCallWidget />
			</AnchorPortal>
			{children}
		</MediaCallViewContext.Provider>
	);
};

export default MediaCallViewProvider;
