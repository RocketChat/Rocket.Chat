import {
	RoomAudioRenderer,
	useConnectionState,
	useLiveKitRoom,
	useLocalParticipant,
	useParticipants,
	useTracks,
} from '@livekit/components-react';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { CallActions, CallMediaProcessing, CallSelf, CallState, RemoteParticipantInfo } from '@rocket.chat/ui-conference';
import {
	CallActionsProvider,
	CallDiagnosticsProvider,
	CallMediaProcessingProvider,
	CallStateProvider,
	VideoQualityProvider,
	playJoinChime,
	playMutedReminder,
	useUpdateCallPreferences,
} from '@rocket.chat/ui-conference';
import { useToastMessageDispatch, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { RemoteParticipant } from 'livekit-client';
import { ConnectionState, Room, RoomEvent, Track } from 'livekit-client';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { connectionStateFor, isAgentParticipant, otherPeople, toRemoteParticipantInfo } from './callParticipants';
import { useBackgroundBlur } from './useBackgroundBlur';
import { useCallDataChannel } from './useCallDataChannel';
import { useCallDeviceSwitching } from './useCallDeviceSwitching';
import { useCallDiagnostics } from './useCallDiagnostics';
import { useLiveKitTransport } from './useLiveKitTransport';
import { useNoiseSuppression } from './useNoiseSuppression';
import { useSendResolution } from './useSendResolution';
import { useSpeakingWhileMuted } from './useSpeakingWhileMuted';
import { useVideoQuality } from './useVideoQuality';

export type LiveKitCallProviderProps = {
	callId: string;
	/** Whether to be in the call. The provider is mounted before the join, so this flips while its tree stays put. */
	connect: boolean;
	/** How the preflight left the devices, read as the call connects. */
	preferences?: { mic?: boolean; cam?: boolean; micId?: string; camId?: string; speakerId?: string };
	/** The call ended for this user, whoever ended it. */
	onEnded: () => void;
	/** Where the workspace serves the blur and noise suppression runtime files. */
	assets: MediaProcessorAssets;
	children: ReactNode;
};

/** New arrivals are announced only while each face in the call still matters. */
const JOIN_CHIME_MAX_PARTICIPANTS = 6;

/** The preflight's choices as they stood when the call connected: what changes during the call is the room's to apply. */
const useArrivalPreferences = (preferences: LiveKitCallProviderProps['preferences'], connect: boolean) => {
	const [arrival, setArrival] = useState(preferences);
	if (!connect && arrival !== preferences) {
		setArrival(preferences);
	}
	return arrival;
};

/**
 * A LiveKit call running in the conference window. Meant to be loaded lazily, so the SDK is fetched for a call
 * rather than on every page load.
 *
 * Mounted around the window before the join: the room exists from the first render and `connect` is what flips,
 * so nothing it wraps remounts when the call starts.
 */
export const LiveKitCallProvider = ({ callId, connect, preferences, onEnded, assets, children }: LiveKitCallProviderProps) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { data: credentials, error: transportError } = useLiveKitTransport(callId, connect);
	const [room] = useState(() => new Room());

	// Failing before the call is up leaves no call to sit in; failing inside one, as a device refusing to publish
	// does, leaves the call as it was.
	const onCallError = useStableCallback((error: Error) => {
		dispatchToastMessage({ type: 'error', message: error });
		if (room.state === ConnectionState.Disconnected) {
			onEnded();
		}
	});

	useEffect(() => {
		if (transportError) {
			onCallError(transportError);
		}
	}, [transportError, onCallError]);

	// A picker or permission prompt the reader dismissed is them changing their mind, not something to report.
	const onToggleError = useStableCallback((error: unknown) => {
		if (error instanceof Error && error.name === 'NotAllowedError') {
			return;
		}
		dispatchToastMessage({ type: 'error', message: error });
	});

	const arrival = useArrivalPreferences(preferences, connect);
	const [startedAt, setStartedAt] = useState(() => new Date());
	const onConnected = useCallback(() => setStartedAt(new Date()), []);

	useLiveKitRoom({
		room,
		token: credentials?.token,
		serverUrl: credentials?.serverUrl,
		connect: connect && Boolean(credentials),
		// Whether to arrive with each track published; which device each opens is `arrival`, below.
		audio: arrival?.mic ?? true,
		video: arrival?.cam ?? false,
		onConnected,
		onDisconnected: onEnded,
		onError: onCallError,
	});

	const roomState = useConnectionState(room);
	const connected = roomState === ConnectionState.Connected;
	const connectionState = connectionStateFor(roomState);

	const persistDevicePreference = useUpdateCallPreferences();
	const {
		localParticipant,
		isMicrophoneEnabled: micEnabled,
		isCameraEnabled: camEnabled,
		isScreenShareEnabled: screenEnabled,
	} = useLocalParticipant({ room });
	const allParticipants = useParticipants({ room });

	const remotes = useMemo(() => otherPeople(allParticipants, localParticipant.identity), [allParticipants, localParticipant.identity]);
	const remoteCameraTracks = useTracks([Track.Source.Camera], { room, onlySubscribed: true });
	const remoteScreenTracks = useTracks([Track.Source.ScreenShare], { room, onlySubscribed: true });
	const remoteAudioTracks = useTracks([Track.Source.Microphone], { room, onlySubscribed: true });

	// A participant's identity is their user id, which is what names their avatar.
	const getUserAvatarPath = useUserAvatarPath();

	const remoteParticipants = useMemo(
		(): RemoteParticipantInfo[] =>
			remotes.map((p) =>
				toRemoteParticipantInfo(
					p,
					{ camera: remoteCameraTracks, screen: remoteScreenTracks, microphone: remoteAudioTracks },
					getUserAvatarPath({ userId: p.identity }),
				),
			),
		[remotes, remoteCameraTracks, remoteScreenTracks, remoteAudioTracks, getUserAvatarPath],
	);

	const localCameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
	const localScreenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
	const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
	const localCameraTrack = localCameraPub?.videoTrack;
	const processedCameraTrack = localCameraTrack?.getProcessor()?.processedTrack;

	// What the call is actually sending, which once a processor is attached is not the raw camera: the reader has to
	// see their own blur. One stream per processed track, so the video element is not handed a new one every render.
	const processedCameraStream = useMemo(
		() => (processedCameraTrack ? new MediaStream([processedCameraTrack]) : undefined),
		[processedCameraTrack],
	);
	const cameraStream = camEnabled ? (processedCameraStream ?? localCameraTrack?.mediaStream) : undefined;
	const screenStream = screenEnabled ? localScreenPub?.track?.mediaStream : undefined;
	const microphoneStream = localMicPub?.track?.mediaStream;

	const noiseSuppression = useNoiseSuppression(localMicPub?.audioTrack, assets);
	const backgroundBlur = useBackgroundBlur(localCameraTrack, assets);
	const sendResolution = useSendResolution(localCameraTrack);
	const videoQuality = useVideoQuality(room, camEnabled ? localCameraTrack : undefined, sendResolution?.height);

	const diagnostics = useCallDiagnostics(
		room,
		allParticipants.filter((p) => p !== localParticipant),
		credentials?.serverUrl ?? '',
		connected,
	);

	useEffect(() => {
		const onConnect = (participant: RemoteParticipant) => {
			if (isAgentParticipant(participant)) return;
			// People only, the reader included, so the chime sounds while the call grows to six and is silent from the seventh.
			const people = [...room.remoteParticipants.values()].filter((p) => !isAgentParticipant(p)).length + 1;
			if (people <= JOIN_CHIME_MAX_PARTICIPANTS) {
				playJoinChime();
			}
		};
		room.on(RoomEvent.ParticipantConnected, onConnect);
		return () => {
			room.off(RoomEvent.ParticipantConnected, onConnect);
		};
	}, [room]);

	const { raisedHands, localHandRaised, activeReactions, toggleHand, sendReaction, muteParticipant } = useCallDataChannel(
		room,
		localParticipant,
	);

	const deviceSelection = useCallDeviceSwitching(room, arrival);

	const speakingWhileMuted = useSpeakingWhileMuted(connected && !micEnabled, playMutedReminder, deviceSelection.selectedIds.audioinput);

	const user = useUser();
	const selfDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const self = useMemo(
		(): CallSelf => ({
			id: user?._id || localParticipant.identity,
			displayName: selfDisplayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
			muted: !micEnabled,
			cameraOn: Boolean(cameraStream),
			screenSharing: Boolean(screenStream),
			handRaised: localHandRaised,
			speakingWhileMuted,
			sendResolution,
			cameraStream,
			screenStream,
			microphoneStream,
		}),
		[
			user?._id,
			localParticipant.identity,
			selfDisplayName,
			getUserAvatarPath,
			micEnabled,
			cameraStream,
			screenStream,
			localHandRaised,
			speakingWhileMuted,
			sendResolution,
			microphoneStream,
		],
	);

	const state = useMemo(
		(): CallState => ({ self, remoteParticipants, raisedHands, activeReactions, startedAt, connectionState }),
		[self, remoteParticipants, raisedHands, activeReactions, startedAt, connectionState],
	);

	const actions = useMemo(
		(): CallActions => ({
			// Remembered only once the device switched, so a refused prompt is not stored as the next call's choice.
			toggleMic: () => {
				localParticipant.setMicrophoneEnabled(!micEnabled).then(() => persistDevicePreference({ mic: !micEnabled }), onToggleError);
			},
			toggleCamera: () => {
				localParticipant.setCameraEnabled(!camEnabled).then(() => persistDevicePreference({ cam: !camEnabled }), onToggleError);
			},
			toggleScreenShare: () => {
				localParticipant.setScreenShareEnabled(!screenEnabled).catch(onToggleError);
			},
			toggleHand,
			sendReaction,
			muteParticipant,
			leave: onEnded,
		}),
		[
			persistDevicePreference,
			micEnabled,
			camEnabled,
			screenEnabled,
			localParticipant,
			toggleHand,
			sendReaction,
			muteParticipant,
			onEnded,
			onToggleError,
		],
	);

	const mediaProcessing = useMemo((): CallMediaProcessing => ({ noiseSuppression, backgroundBlur }), [noiseSuppression, backgroundBlur]);

	return (
		<CallStateProvider value={state}>
			<CallActionsProvider value={actions}>
				<DeviceSelectionProvider value={deviceSelection}>
					<VideoQualityProvider value={videoQuality}>
						<CallMediaProcessingProvider value={mediaProcessing}>
							<CallDiagnosticsProvider value={diagnostics ?? null}>
								{children}
								<RoomAudioRenderer room={room} />
							</CallDiagnosticsProvider>
						</CallMediaProcessingProvider>
					</VideoQualityProvider>
				</DeviceSelectionProvider>
			</CallActionsProvider>
		</CallStateProvider>
	);
};

export default LiveKitCallProvider;
