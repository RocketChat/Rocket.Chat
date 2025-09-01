import { AnchorPortal } from '@rocket.chat/ui-client';
import {
	useEndpoint,
	useUserAvatarPath,
	useUserId,
	useSetOutputMediaDevice,
	useSetInputMediaDevice,
	Device,
	// useSelectedDevices,
} from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useCallSounds } from './useCallSounds';
import { useMediaSessionInstance, useMediaSession } from './useMediaSession';
import useMediaStream from './useMediaStream';
import { useDevicePermissionPrompt2, stopTracks } from '../hooks/useDevicePermissionPrompt';
import MediaCallContext, { PeerInfo } from '../v2/MediaCallContext';
import MediaCallWidget from '../v2/MediaCallWidget';

const MediaCallProvider = ({ children }: { children: React.ReactNode }) => {
	const userId = useUserId();

	const { instance, processor } = useMediaSessionInstance(userId ?? undefined);
	// console.log('instance', instance);
	const session = useMediaSession(instance, processor);

	const [remoteStreamRefCallback, audioElement] = useMediaStream(instance);

	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();

	const requestDevice = useDevicePermissionPrompt2();

	useCallSounds(
		session.state,
		useCallback(
			(callback) => {
				if (!instance) {
					return;
				}
				return instance.on('endedCall', () => callback());
			},
			[instance],
		),
	);

	// mute/hold
	useEffect(() => {
		if (!processor) {
			return;
		}

		const micMuted = session.muted || session.held;

		processor.toggleSenderTracks(!micMuted);
		processor.toggleReceiverTracks(!session.held);
	}, [processor, session.muted, session.held]);

	const onMute = () => session.toggleMute();
	const onHold = () => session.toggleHold();

	const onCall = async (_id: string, kind: 'user' | 'sip') => {
		console.log('onCall', _id, kind);
		if (session.state !== 'new') {
			console.error('Cannot start call in state', session.state);
			return;
		}
		stopTracks(
			await requestDevice({
				actionType: 'outgoing',
				constraints: {
					audio: true,
				},
			}),
		);
		session.startCall(_id, kind);
	};

	const onAccept = async () => {
		console.log('onAccept');
		if (session.state !== 'ringing') {
			console.error('Cannot accept call in state', session.state);
			return;
		}
		stopTracks(
			await requestDevice({
				actionType: 'incoming',
				constraints: {
					audio: true,
				},
			}),
		);
		session.acceptCall();
	};

	const onDeviceChange = (device: Device) => {
		console.log('onDeviceChange', device);
		if (device.type === 'audiooutput') {
			if (!audioElement.current) return;
			setOutputMediaDevice({ outputDevice: device, HTMLAudioElement: audioElement.current });
		} else {
			void requestDevice({
				actionType: 'device-change',
				constraints: {
					audio: {
						deviceId: {
							exact: device.id,
						},
					},
				},
			})
				.then((stream) => {
					setInputMediaDevice(device);
					session.changeDevice(stream.getTracks()[0]);
				})
				.catch((error) => {
					console.error('Error changing device', error);
				});
		}
	};

	const onForward = () => {
		console.log('forward');
		session.forwardCall();
	};

	const onTone = (tone: string) => {
		console.log('tone', tone);
		session.sendTone(tone);
	};

	const onEndCall = () => {
		console.log('end call');
		session.endCall();
	};

	const onSelectPeer = (peerInfo: PeerInfo) => {
		session.selectPeer(peerInfo);
	};

	const getAvatarPath = useUserAvatarPath();

	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
	// const usersInfoEndpoint = useEndpoint('GET', '/v1/users.info');

	const getAutocompleteOptions = async (filter: string) => {
		const { items } = await usersAutoCompleteEndpoint({ selector: JSON.stringify({ term: filter, conditions: {} }) });
		return (
			items.map((user) => {
				const label = user.name || user.username;
				// TODO: This endpoint does not provide the extension number, which is necessary to show in the UI.
				const identifier = user.username !== label ? user.username : undefined;

				return {
					value: user._id,
					label,
					identifier,
					avatarUrl: getAvatarPath({ username: user.username, etag: user.avatarETag }),
				};
			}) || []
		);
	};

	const onToggleWidget = (peerInfo?: PeerInfo) => {
		session.toggleWidget(peerInfo);
	};

	const contextValue = {
		state: session.state,
		muted: session.muted,
		held: session.held,
		peerInfo: session.peerInfo,
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
		getPeerInfo: () => Promise.resolve(session.peerInfo), // TODO remove this probably
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
