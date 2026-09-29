import {
	RoomAudioRenderer,
	useConnectionState,
	useLiveKitRoom,
	useLocalParticipant,
	useParticipants,
	useTracks,
} from '@livekit/components-react';
import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { CallActions, CallMediaProcessing, CallSelf, CallState, RemoteParticipantInfo } from '@rocket.chat/ui-conference';
import {
	CallActionsProvider,
	CallDeviceSelectionProvider,
	CallDiagnosticsProvider,
	CallMediaProcessingProvider,
	CallStateProvider,
	playJoinChime,
	playMutedReminder,
	useUpdateCallPreferences,
} from '@rocket.chat/ui-conference';
import { useToastMessageDispatch, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { LocalAudioTrack, LocalVideoTrack, RemoteParticipant } from 'livekit-client';
import { ConnectionState, Room, RoomEvent, Track } from 'livekit-client';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

	// With no credentials there is no call to sit in.
	useEffect(() => {
		if (!transportError) {
			return;
		}
		dispatchToastMessage({ type: 'error', message: transportError });
		onEnded();
	}, [transportError, dispatchToastMessage, onEnded]);

	const arrival = useArrivalPreferences(preferences, connect);
	const [room] = useState(() => new Room());
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
	const localCameraTrack = localCameraPub?.track as LocalVideoTrack | undefined;
	const processedCameraTrack = localCameraTrack?.getProcessor()?.processedTrack;

	// What the call is actually being sent, which once a processor is attached is not the raw camera: the reader has
	// to see their own blur. The processed track needs a stream around it, held per track so the video element is not
	// handed a new object to start over with on every render.
	const localProcessedStream = useRef<{ track: MediaStreamTrack; stream: MediaStream } | null>(null);
	const cameraStream = useMemo(() => {
		if (!camEnabled) {
			return undefined;
		}

		if (processedCameraTrack) {
			if (localProcessedStream.current?.track !== processedCameraTrack) {
				localProcessedStream.current = { track: processedCameraTrack, stream: new MediaStream([processedCameraTrack]) };
			}
			return localProcessedStream.current.stream;
		}

		localProcessedStream.current = null;
		return localCameraTrack?.mediaStream;
		// Keyed on the publication's sid rather than the publication object, which is re-derived whenever any local
		// track changes — the microphone included — and made the camera blink every time the mic was touched.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localCameraPub?.trackSid, localCameraTrack?.mediaStream, processedCameraTrack, camEnabled]);
	const screenStream = screenEnabled ? localScreenPub?.track?.mediaStream : undefined;
	const microphoneStream = localMicPub?.track?.mediaStream;

	const noiseSuppression = useNoiseSuppression(localMicPub?.track as LocalAudioTrack | undefined, assets);
	const backgroundBlur = useBackgroundBlur(localCameraTrack, assets);
	const videoQuality = useVideoQuality(localCameraTrack);
	const sendResolution = useSendResolution(localCameraTrack);

	const diagnostics = useCallDiagnostics(
		room,
		allParticipants.filter((p) => p !== localParticipant),
		credentials?.serverUrl ?? '',
		connected,
	);

	const speakingWhileMuted = useSpeakingWhileMuted(connected && !micEnabled);

	const mutedReminderPlayed = useRef(false);
	useEffect(() => {
		mutedReminderPlayed.current = false;
	}, [micEnabled]);
	useEffect(() => {
		if (!speakingWhileMuted || mutedReminderPlayed.current) return;
		mutedReminderPlayed.current = true;
		playMutedReminder();
	}, [speakingWhileMuted]);

	useEffect(() => {
		const onConnect = (participant: RemoteParticipant) => {
			if (isAgentParticipant(participant)) return;
			// Includes the reader, so the chime sounds while the call grows to six and is silent from the seventh.
			if (room.numParticipants <= JOIN_CHIME_MAX_PARTICIPANTS) {
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

	// Only for the app's output-device setter, which insists on an element: LiveKit sets the sink on its own.
	const [outputElement] = useState(() => new Audio());
	const deviceSelection = useCallDeviceSwitching(room, localCameraPub, arrival, outputElement);

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
			toggleMic: () => {
				persistDevicePreference({ mic: !micEnabled });
				void localParticipant.setMicrophoneEnabled(!micEnabled);
			},
			toggleCamera: () => {
				persistDevicePreference({ cam: !camEnabled });
				void localParticipant.setCameraEnabled(!camEnabled);
			},
			toggleScreenShare: () => void localParticipant.setScreenShareEnabled(!screenEnabled),
			toggleHand,
			sendReaction,
			muteParticipant,
			leave: onEnded,
		}),
		[persistDevicePreference, micEnabled, camEnabled, screenEnabled, localParticipant, toggleHand, sendReaction, muteParticipant, onEnded],
	);

	const mediaProcessing = useMemo(
		(): CallMediaProcessing => ({ noiseSuppression, backgroundBlur, videoQuality }),
		[noiseSuppression, backgroundBlur, videoQuality],
	);

	return (
		<CallStateProvider value={state}>
			<CallActionsProvider value={actions}>
				<CallDeviceSelectionProvider value={deviceSelection}>
					<CallMediaProcessingProvider value={mediaProcessing}>
						<CallDiagnosticsProvider value={diagnostics ?? null}>
							{children}
							<RoomAudioRenderer room={room} />
						</CallDiagnosticsProvider>
					</CallMediaProcessingProvider>
				</CallDeviceSelectionProvider>
			</CallActionsProvider>
		</CallStateProvider>
	);
};

export default LiveKitCallProvider;
