import {
	RoomAudioRenderer,
	useConnectionState,
	useLiveKitRoom,
	useLocalParticipant,
	useParticipants,
	useTracks,
} from '@livekit/components-react';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { CallActions, CallSelf, CallState, RemoteParticipantInfo } from '@rocket.chat/ui-conference';
import {
	CallActionsProvider,
	CallDiagnosticsProvider,
	CallStateProvider,
	VideoQualityProvider,
	playJoinChime,
	playMutedReminder,
	useUpdateCallPreferences,
} from '@rocket.chat/ui-conference';
import { useToastMessageDispatch, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { Participant, RemoteParticipant } from 'livekit-client';
import { ConnectionState, Room, RoomEvent, Track } from 'livekit-client';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CallConnection, CallSFU, RemoteSFUConnection } from './callConnections';
import { OWN_SFU } from './callConnections';
import type { CallPerson } from './callParticipants';
import { connectionStateFor, isAgentParticipant, otherPeople, subscribedTracksOf, toPersonInfo } from './callParticipants';
import type { CallRoster } from './callRoster';
import { useCallDataChannel } from './useCallDataChannel';
import { useCallDeviceSwitching } from './useCallDeviceSwitching';
import { useCallDiagnostics } from './useCallDiagnostics';
import { useLiveKitTransport } from './useLiveKitTransport';
import { useRemoteSFUParticipants } from './useRemoteSFUParticipants';
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
	/** Who is who in a federated call, whose participants go by their membership's LiveKit identity rather than their user id. */
	roster?: CallRoster;
	/** The other homeservers' SFUs a federated call watches, where the members they host publish. */
	remoteSFUs?: readonly RemoteSFUConnection[];
	children: ReactNode;
};

const NO_REMOTE_SFUS: readonly RemoteSFUConnection[] = [];

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
 * A LiveKit call running in the conference window, published on this server's SFU. In a federated call, whoever the
 * other homeservers' SFUs carry is in it too. Meant to be loaded lazily, so the SDK is fetched for a call rather than
 * on every page load.
 *
 * Mounted around the window before the join: the room exists from the first render and `connect` is what flips,
 * so nothing it wraps remounts when the call starts.
 */
export const LiveKitCallProvider = ({
	callId,
	connect,
	preferences,
	onEnded,
	roster,
	remoteSFUs = NO_REMOTE_SFUS,
	children,
}: LiveKitCallProviderProps) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { data: credentials, error: transportError } = useLiveKitTransport(callId, connect);
	const [room] = useState(() => new Room());
	const federated = Boolean(credentials?.federation);

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

	const remoteSFUParticipants = useRemoteSFUParticipants(remoteSFUs);

	const getUserAvatarPath = useUserAvatarPath();

	const personOf = useCallback(
		(sfu: CallSFU, participant: Pick<Participant, 'identity' | 'name'>): CallPerson | undefined => {
			if (federated) {
				return roster?.personOn(sfu, participant.identity);
			}
			// Outside a federated call a participant's identity is their user id, which is what names their avatar.
			return {
				id: participant.identity,
				displayName: participant.name || participant.identity,
				avatarUrl: getUserAvatarPath({ userId: participant.identity }),
			};
		},
		[federated, roster, getUserAvatarPath],
	);

	// Each person with the identity they are seen under, which is the one a request meant for them has to name.
	const { remoteParticipants, identities } = useMemo(() => {
		const ownTracks = { camera: remoteCameraTracks, screen: remoteScreenTracks, microphone: remoteAudioTracks };
		const people: RemoteParticipantInfo[] = [];
		const identityByPerson = new Map<string, string>();

		const add = (sfu: CallSFU, participant: Parameters<typeof toPersonInfo>[0], tracks: Parameters<typeof toPersonInfo>[1]) => {
			const person = personOf(sfu, participant);
			if (person) {
				people.push(toPersonInfo(participant, tracks, person));
				identityByPerson.set(person.id, participant.identity);
			}
		};

		remotes.forEach((participant) => add(OWN_SFU, participant, ownTracks));
		remoteSFUParticipants.forEach(({ connection, participant }) => add(connection.sfu, participant, subscribedTracksOf(participant)));

		return { remoteParticipants: people, identities: identityByPerson };
	}, [remotes, remoteSFUParticipants, remoteCameraTracks, remoteScreenTracks, remoteAudioTracks, personOf]);

	const localCameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
	const localScreenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
	const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
	const localCameraTrack = localCameraPub?.videoTrack;

	const cameraStream = camEnabled ? localCameraTrack?.mediaStream : undefined;
	const screenStream = screenEnabled ? localScreenPub?.track?.mediaStream : undefined;
	const microphoneStream = localMicPub?.track?.mediaStream;

	const sendResolution = useSendResolution(localCameraTrack);
	const videoQuality = useVideoQuality(room, camEnabled ? localCameraTrack : undefined, sendResolution?.height);

	const diagnostics = useCallDiagnostics(
		room,
		allParticipants.filter((p) => p !== localParticipant && personOf(OWN_SFU, p)),
		credentials?.serverUrl ?? '',
		connected,
	);

	const connections = useMemo((): CallConnection[] => [{ sfu: OWN_SFU, room }, ...remoteSFUs], [room, remoteSFUs]);

	useEffect(() => {
		const isPerson = (sfu: CallSFU, participant: RemoteParticipant) =>
			!isAgentParticipant(participant) && Boolean(personOf(sfu, participant));

		const stops = connections.map(({ sfu, room: connectionRoom }) => {
			const onConnect = (participant: RemoteParticipant) => {
				if (!isPerson(sfu, participant)) return;
				// People only, the reader included, so the chime sounds while the call grows to six and is silent from the seventh.
				const people = connections.reduce(
					(count, other) => count + [...other.room.remoteParticipants.values()].filter((p) => isPerson(other.sfu, p)).length,
					1,
				);
				if (people <= JOIN_CHIME_MAX_PARTICIPANTS) {
					playJoinChime();
				}
			};
			connectionRoom.on(RoomEvent.ParticipantConnected, onConnect);
			return () => {
				connectionRoom.off(RoomEvent.ParticipantConnected, onConnect);
			};
		});
		return () => stops.forEach((stop) => stop());
	}, [connections, personOf]);

	const user = useUser();
	const selfId = user?._id || localParticipant.identity;

	const targetOf = useCallback(
		(personId: string) => (federated ? (identities.get(personId) ?? roster?.identityOf(personId)) : personId),
		[federated, identities, roster],
	);

	const { raisedHands, localHandRaised, activeReactions, toggleHand, sendReaction, muteParticipant } = useCallDataChannel(
		localParticipant,
		{
			selfId,
			connections,
			personOf,
			targetOf,
		},
	);

	const deviceSelection = useCallDeviceSwitching(room, arrival);

	// What the other SFUs carry plays through the speaker the call is on.
	const speakerId = deviceSelection.selectedIds.audiooutput;
	useEffect(() => {
		if (!speakerId) return;
		remoteSFUs.forEach(({ room: remoteRoom }) => {
			remoteRoom.switchActiveDevice('audiooutput', speakerId).catch((err: unknown) => console.warn('audiooutput switch failed', err));
		});
	}, [remoteSFUs, speakerId]);

	const speakingWhileMuted = useSpeakingWhileMuted(connected && !micEnabled, playMutedReminder, deviceSelection.selectedIds.audioinput);

	const selfDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const self = useMemo(
		(): CallSelf => ({
			id: selfId,
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
			selfId,
			user?._id,
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

	return (
		<CallStateProvider value={state}>
			<CallActionsProvider value={actions}>
				<DeviceSelectionProvider value={deviceSelection}>
					<VideoQualityProvider value={videoQuality}>
						<CallDiagnosticsProvider value={diagnostics ?? null}>
							{children}
							<RoomAudioRenderer room={room} />
							{remoteSFUs.map(({ sfu, room: remoteRoom }) => (
								<RoomAudioRenderer key={sfu.key} room={remoteRoom} />
							))}
						</CallDiagnosticsProvider>
					</VideoQualityProvider>
				</DeviceSelectionProvider>
			</CallActionsProvider>
		</CallStateProvider>
	);
};

export default LiveKitCallProvider;
