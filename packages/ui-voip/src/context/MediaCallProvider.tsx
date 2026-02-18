import { AnchorPortal, useGoToDirectMessage } from '@rocket.chat/ui-client';
import type { Device } from '@rocket.chat/ui-contexts';
import {
	useEndpoint,
	useUserAvatarPath,
	useSetOutputMediaDevice,
	useSetInputMediaDevice,
	useUser,
	useSetModal,
	useSelectedDevices,
	useToastMessageDispatch,
	useSetting,
} from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { PeerInfo } from './MediaCallContext';
import MediaCallContext from './MediaCallContext';
import { useCallSounds } from './useCallSounds';
import { useDesktopNotifications } from './useDesktopNotifications';
import { getExtensionFromPeerInfo, useMediaSession } from './useMediaSession';
import { useMediaSessionControls } from './useMediaSessionControls';
import { useMediaSessionInstance } from './useMediaSessionInstance';
import useMediaStream from './useMediaStream';
import { isValidTone, useTonePlayer } from './useTonePlayer';
import { stopTracks, useDevicePermissionPrompt2, PermissionRequestCancelledCallRejectedError } from '../hooks/useDevicePermissionPrompt';
import { MediaCallWidget } from '../views';
import TransferModal from '../views/TransferModal';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const user = useUser();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [openRoomId, setOpenRoomId] = useState<string | undefined>(undefined);

	const setModal = useSetModal();

	const userId = user?._id;

	const instance = useMediaSessionInstance(userId ?? undefined);

	const state = useMediaSession(instance);
	const controls = useMediaSessionControls(instance);

	useDesktopNotifications(state);

	const [remoteStreamRefCallback, audioElement] = useMediaStream(instance);

	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();

	const { audioInput, audioOutput } = useSelectedDevices() || {};

	const requestDevice = useDevicePermissionPrompt2();

	const forceSIPRouting = useSetting('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls');

	const onClickDirectMessage = useGoToDirectMessage(
		{ username: state.peerInfo && 'username' in state.peerInfo ? state.peerInfo.username : undefined },
		openRoomId,
	);

	useEffect(() => {
		if (audioInput?.id && !state.hidden) {
			void controls.changeDevice(audioInput.id);
		}
	}, [audioInput?.id, controls, state.hidden]);

	useCallSounds(
		state.hidden ? 'closed' : state.state,
		useCallback(
			(callback) => {
				if (!instance) {
					return;
				}
				return instance.on('endedCall', () => {
					if (state.hidden) {
						return;
					}
					callback();
				});
			},
			[instance, state.hidden],
		),
	);

	const onMute = () => controls.toggleMute();
	const onHold = () => controls.toggleHold();

	const onCall = async () => {
		if (state.state !== 'new') {
			console.error('Cannot start call in state', state.state);
			return;
		}

		const { peerInfo } = state;

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
		if (state.state !== 'ringing') {
			console.error('Cannot accept call in state', state.state);
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
			if (!audioElement.current) return;
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
		state.selectPeer(peerInfo);
	};

	const getAvatarPath = useUserAvatarPath();

	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');

	const getAutocompleteOptions = async (filter: string) => {
		const peerUsername = state.peerInfo && 'username' in state.peerInfo ? state.peerInfo.username : undefined;
		const peerExtension = state.peerInfo ? getExtensionFromPeerInfo(state.peerInfo) : undefined;

		const conditions =
			peerExtension || forceSIPRouting
				? {
						$and: [
							forceSIPRouting && { freeSwitchExtension: { $exists: true } },
							peerExtension && { freeSwitchExtension: { $ne: peerExtension } },
						].filter(Boolean),
					}
				: undefined;

		const exceptions = [user?.username, peerUsername].filter(Boolean);

		const { items } = await usersAutoCompleteEndpoint({
			selector: JSON.stringify({ term: filter, exceptions, ...(conditions && { conditions }) }),
		});
		return (
			items.map((user) => {
				const label = user.name || user.username;
				// TODO: This endpoint does not provide the extension number, which is necessary to show in the UI.
				const identifier = user.username !== label ? user.username : undefined;

				return {
					value: user._id,
					label,
					identifier,
					status: user.status,
					avatarUrl: getAvatarPath({ username: user.username, etag: user.avatarETag }),
				};
			}) || []
		);
	};

	const onToggleWidget = (peerInfo?: PeerInfo) => {
		state.toggleWidget(peerInfo);
	};

	const contextValue = {
		connectionState: state.connectionState,
		state: state.state,
		muted: state.muted,
		held: state.held,
		peerInfo: state.peerInfo,
		transferredBy: state.transferredBy,
		hidden: state.hidden,
		remoteMuted: state.remoteMuted,
		remoteHeld: state.remoteHeld,
		onClickDirectMessage,
		setOpenRoomId,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onAccept,
		onToggleWidget,
		onSelectPeer,
		getAutocompleteOptions,
	};

	return (
		<MediaCallContext.Provider value={contextValue}>
			{createPortal(
				<audio ref={remoteStreamRefCallback}>
					<track kind='captions' />
				</audio>,
				document.body,
			)}
			<AnchorPortal id='rcx-media-call-widget-portal'>
				<MediaCallWidget />
			</AnchorPortal>
			{children}
		</MediaCallContext.Provider>
	);
};

export default MediaCallProvider;
