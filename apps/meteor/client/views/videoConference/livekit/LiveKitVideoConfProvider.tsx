/* eslint-disable react/no-multi-comp */
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useRoomContext, useTracks } from '@livekit/components-react';
import type { Device } from '@rocket.chat/ui-contexts';
import {
	useAvailableDevices,
	useSetInputMediaDevice,
	useSetOutputMediaDevice,
	useToastMessageDispatch,
	useUserAvatarPath,
} from '@rocket.chat/ui-contexts';
import {
	MediaCallViewContext,
	defaultMediaCallContextValue,
	playHandRaiseChime,
	playJoinChime,
	playMutedReminder,
	type RemoteParticipantInfo,
} from '@rocket.chat/ui-voip';
import type { LocalAudioTrack, LocalVideoTrack, RemoteParticipant, RoomOptions } from 'livekit-client';
import { ParticipantKind, RoomEvent, Track } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import CallDiagnosticsContext from './CallDiagnosticsContext';
import { useLiveKitVideoConf } from './LiveKitVideoConfContext';
import { useBackgroundBlur } from './useBackgroundBlur';
import { useCallDiagnostics } from './useCallDiagnostics';
import { useNoiseSuppression } from './useNoiseSuppression';
import { useSendResolution } from './useSendResolution';
import { useSpeakingWhileMuted } from './useSpeakingWhileMuted';
import { useVideoQuality } from './useVideoQuality';

/**
 * The devices the preflight chose, as the room's *capture defaults*.
 *
 * They used to be passed as the `audio`/`video` capture options instead, which describe only the track published
 * on the way in — so a call joined muted, which is the normal way to join, threw the chosen microphone away along
 * with the `false`, and unmuting later opened whichever device the browser prefers. Capture defaults are read
 * every time a track is created, including that one.
 *
 * LiveKit merges these over its own audio defaults, so echo cancellation and the rest survive, and it seeds the
 * room's active-device map from them — which is what makes the room, rather than this preference, the thing to ask
 * later about which device is in use.
 */
const captureDefaults = ({ micId, camId }: { micId?: string; camId?: string } = {}): RoomOptions => ({
	...(micId && { audioCaptureDefaults: { deviceId: micId } }),
	...(camId && { videoCaptureDefaults: { deviceId: camId } }),
});

/**
 * The device id out of a constraint, which the spec allows to be a bare string, a list, or an object with `exact`
 * or `ideal`. LiveKit stores whatever it was given, so all of them turn up here.
 */
const deviceIdFrom = (constraint: MediaTrackConstraints['deviceId']): string | undefined => {
	if (typeof constraint === 'string') {
		return constraint;
	}
	if (Array.isArray(constraint)) {
		return constraint[0];
	}
	const exact = constraint?.exact ?? constraint?.ideal;
	if (typeof exact === 'string') {
		return exact;
	}
	return Array.isArray(exact) ? exact[0] : undefined;
};

const headersOf = () => ({
	'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
	'X-User-Id': localStorage.getItem('Meteor.userId') || '',
});

type LKCreds = { serverUrl: string; token: string; roomName: string };

/**
 * Throws rather than returning null when the credentials are refused, because the two mean opposite things to
 * whoever is waiting: no credentials *yet* is a call still connecting, while credentials refused is a call that
 * will never connect. Swallowing the difference produced the worst possible screen — the call apparently running,
 * the user alone in it, and every control inert — with nothing anywhere to say why.
 */
const fetchTransportConfig = async (callId: string): Promise<LKCreds | null> => {
	const res = await fetch(`/api/v1/video-conference.livekit.transport.config?callId=${encodeURIComponent(callId)}`, {
		headers: headersOf(),
	});
	if (!res.ok) {
		throw new Error(`transport config refused with ${res.status}`);
	}
	const data = (await res.json()) as { service: string; livekit?: LKCreds };
	return data.service === 'livekit' && data.livekit ? data.livekit : null;
};

/**
 * Tell the server the user has left this call — the same endpoint every provider reports a departure to, because
 * who is in a call is the roster's business rather than the media server's.
 *
 * Best-effort: it is idempotent, and a lost one is survivable by design. Leaving is really inferred from the
 * heartbeat stopping, so this only makes an immediate departure immediate rather than a lease's worth of wait.
 *
 * `keepalive` lets this complete after a page-unload tear-down (when the user
 * closes the tab); inside the running app a normal fetch is fine.
 */
const requestLeaveGroup = (callId: string, opts?: { keepalive?: boolean }) => {
	try {
		void fetch('/api/v1/video-conference.leave', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headersOf() },
			body: JSON.stringify({ callId }),
			keepalive: opts?.keepalive,
		}).catch(() => undefined);
	} catch {
		/* unload-time errors are not actionable */
	}
};

/**
 * Inner bridge: lives inside <LiveKitRoom> as a sibling of children. Reads LK
 * hooks every render, computes the MediaCallViewContext value, and pushes it
 * up to the parent via onContextChange. Renders nothing — children stay in
 * their stable position in the React tree above, avoiding a full app remount
 * when the LK room mounts/unmounts on call start/end.
 */
const InnerProvider = ({
	callId,
	speakerId,
	serverUrl,
	onLeave,
	onContextChange,
	onDiagnosticsChange,
}: {
	/** The output device the preflight chose. Capture options can't carry it — it isn't a published track. */
	speakerId?: string;
	callId: string;
	serverUrl: string;
	onLeave: () => void;
	onContextChange: (value: unknown) => void;
	onDiagnosticsChange: (value: unknown) => void;
}) => {
	const room = useRoomContext();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setInputDevice = useSetInputMediaDevice();
	const setOutputDevice = useSetOutputMediaDevice();
	const availableDevices = useAvailableDevices();
	// What has already been written, so re-running on a new device list can't turn into a write-and-rerender loop.
	const recorded = useRef<Partial<Record<'audioinput' | 'audiooutput', string>>>({});

	const persistDevicePreference = useCallback((updates: Record<string, string | boolean>) => {
		try {
			const key = 'fuselage-localStorage-videoconf-call-preferences';
			const raw = localStorage.getItem(key);
			const stored = raw ? JSON.parse(raw) : {};
			localStorage.setItem(key, JSON.stringify({ ...stored, ...updates }));
		} catch {
			/* localStorage unavailable */
		}
	}, []);
	const { localParticipant } = useLocalParticipant();
	const allParticipants = useParticipants();
	const startedAt = useRef(new Date()).current;

	const [micEnabled, setMicEnabled] = useState(localParticipant.isMicrophoneEnabled);
	const [camEnabled, setCamEnabled] = useState(localParticipant.isCameraEnabled);
	const [screenEnabled, setScreenEnabled] = useState(localParticipant.isScreenShareEnabled);

	useEffect(() => {
		const sync = () => {
			setMicEnabled(localParticipant.isMicrophoneEnabled);
			setCamEnabled(localParticipant.isCameraEnabled);
			setScreenEnabled(localParticipant.isScreenShareEnabled);
		};
		sync();
		const evts = ['trackMuted', 'trackUnmuted', 'localTrackPublished', 'localTrackUnpublished'];
		evts.forEach((e) => localParticipant.on(e as any, sync));
		return () => {
			evts.forEach((e) => localParticipant.off(e as any, sync));
		};
	}, [localParticipant]);

	// LK marks agent participants with kind=AGENT, but that property can be set
	// after the participant first appears — useParticipants() may not re-emit
	// when only `kind` flips, leaving the agent tile rendered for whichever
	// client happened to subscribe before the update. We additionally check
	// the identity prefix (LK auto-generates agent identities as
	// `agent-AJ_<jobId>` when the worker doesn't set its own), which is
	// race-free because identity is set at join time.
	const isAgentParticipant = (p: { identity: string; kind?: ParticipantKind }) => {
		if (p.kind === ParticipantKind.AGENT) return true;
		const id = p.identity || '';
		return id.startsWith('agent-') || id.startsWith('agent_') || /^AJ_[A-Za-z0-9]+$/.test(id);
	};
	const remotes = useMemo(
		() =>
			allParticipants.filter(
				(p) => p.identity !== localParticipant.identity && !isAgentParticipant(p as { identity: string; kind?: ParticipantKind }),
			),
		[allParticipants, localParticipant.identity],
	);
	const remoteCameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
	const remoteScreenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: true });
	const remoteAudioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true });

	// LK uses participant.identity == userId, so we can derive each remote's
	// avatar through the same hook used for the local user. Without this, every
	// remote tile fell back to the generic user-placeholder icon.
	const getUserAvatarPath = useUserAvatarPath();

	const remoteParticipants: RemoteParticipantInfo[] = useMemo(() => {
		return remotes.map((p) => {
			const cam = remoteCameraTracks.find((t) => t.participant.identity === p.identity);
			const scr = remoteScreenTracks.find((t) => t.participant.identity === p.identity);
			const aud = remoteAudioTracks.find((t) => t.participant.identity === p.identity);
			const micPub = p.getTrackPublication(Track.Source.Microphone);
			// Skip the camera/screen streams when the remote publication is
			// muted — useTracks() can still surface the publication after the
			// remote disables their camera, and a "muted" video stream renders
			// as a black frame instead of falling back to the avatar.
			const camMuted = cam?.publication?.isMuted ?? true;
			const scrMuted = scr?.publication?.isMuted ?? true;
			return {
				id: p.identity,
				displayName: p.name || p.identity,
				avatarUrl: getUserAvatarPath({ userId: p.identity }),
				muted: Boolean(!micPub || micPub.isMuted),
				held: false,
				cameraStream: cam && !camMuted ? cam.publication?.track?.mediaStream : undefined,
				screenStream: scr && !scrMuted ? scr.publication?.track?.mediaStream : undefined,
				audioStream: aud?.publication?.track?.mediaStream,
			};
		});
	}, [remotes, remoteCameraTracks, remoteScreenTracks, remoteAudioTracks, getUserAvatarPath]);

	const localCameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
	const localScreenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
	const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
	// What the call is actually being sent, which once a processor is attached is not the raw camera: background blur
	// went out to everyone else while the person who switched it on saw themselves unblurred, with no way to tell it
	// was working.
	//
	// The processed track is a track on its own, so it needs a stream around it — held in a ref keyed by the track, so
	// re-renders reuse the same MediaStream rather than handing the video element a new object to start over with.
	const localProcessedStream = useRef<{ track: MediaStreamTrack; stream: MediaStream } | null>(null);
	const localCameraStream = useMemo(() => {
		const track = localCameraPub?.track;
		const processed = track?.getProcessor()?.processedTrack;

		if (processed) {
			if (localProcessedStream.current?.track !== processed) {
				localProcessedStream.current = { track: processed, stream: new MediaStream([processed]) };
			}
			return { active: camEnabled, stream: localProcessedStream.current.stream };
		}

		localProcessedStream.current = null;
		return track?.mediaStream ? { active: camEnabled, stream: track.mediaStream } : undefined;
		// Keyed below on the publication's *sid* rather than the publication object: that object is re-derived
		// whenever any local track changes — the microphone included — which used to rebuild this for no reason and
		// made the camera blink every time the mic was touched.
	}, [localCameraPub?.trackSid, localCameraPub?.track?.mediaStream, localCameraPub?.track?.getProcessor()?.processedTrack, camEnabled]);
	const localScreenStream = useMemo(
		() => (localScreenPub?.track?.mediaStream ? { active: screenEnabled, stream: localScreenPub.track.mediaStream } : undefined),
		[localScreenPub?.track?.mediaStream, screenEnabled],
	);
	const localMicrophoneStream = useMemo(
		() => (localMicPub?.track?.mediaStream ? { active: micEnabled, stream: localMicPub.track.mediaStream } : undefined),
		[localMicPub?.track?.mediaStream, micEnabled],
	);

	// Noise cancelling on the published microphone, and the switch the user gets for it. See `useNoiseSuppression`
	// for why it waits for the track and why switching it off leaves the filter attached.
	const noiseSuppression = useNoiseSuppression(localMicPub?.track as LocalAudioTrack | undefined);

	// The same arrangement for the camera: whatever can blur its background, and the switch for it.
	const backgroundBlur = useBackgroundBlur(localCameraPub?.track as LocalVideoTrack | undefined);

	// The most detail to send, which is the other thing about the camera worth choosing.
	const videoQuality = useVideoQuality(localCameraPub?.track as LocalVideoTrack | undefined);

	// What the encoder is actually sending, which is not what the camera is capturing.
	const sendResolution = useSendResolution(localCameraPub?.track as LocalVideoTrack | undefined);

	const diagnostics = useCallDiagnostics(
		room,
		allParticipants.filter((p) => p !== localParticipant),
		serverUrl,
	);

	const speakingWhileMuted = useSpeakingWhileMuted(!micEnabled);

	const swmSoundPlayed = useRef(false);
	useEffect(() => {
		swmSoundPlayed.current = false;
	}, [micEnabled]);
	useEffect(() => {
		if (!speakingWhileMuted || swmSoundPlayed.current) return;
		swmSoundPlayed.current = true;
		playMutedReminder();
	}, [speakingWhileMuted]);

	const onToggleMic = useCallback(() => {
		const next = !micEnabled;
		persistDevicePreference({ mic: next });
		void localParticipant.setMicrophoneEnabled(next);
	}, [localParticipant, micEnabled, persistDevicePreference]);
	const onToggleCamera = useCallback(() => {
		const next = !camEnabled;
		persistDevicePreference({ cam: next });
		void localParticipant.setCameraEnabled(next);
	}, [localParticipant, camEnabled, persistDevicePreference]);
	const onToggleScreen = useCallback(() => void localParticipant.setScreenShareEnabled(!screenEnabled), [localParticipant, screenEnabled]);

	// Raise-hand state, broadcast over the LK data channel. raisedAt is used to
	// sort the queue position shown on the tile. A late-joining peer only sees
	// hands that are raised after they join (LK data channel doesn't replay).
	const [handsMap, setHandsMap] = useState<Record<string, number>>({});
	const [localHandRaised, setLocalHandRaised] = useState(false);
	const localRaisedAtRef = useRef(0);
	/** Whose raised hand has already been announced, so the same hand is never announced twice. */
	const announcedHandsRef = useRef<Set<string>>(new Set());

	// Reactions: floating emoji broadcast from a participant to everyone in the
	// call. The visible life of each one is the CSS animation duration; the
	// state entry sticks around for REACTION_TTL_MS before auto-removal so
	// React unmounts the DOM after the animation completes.
	const [activeReactions, setActiveReactions] = useState<
		{ id: string; participantId: string; emoji: string; sentAt: number; expiresAt: number }[]
	>([]);
	const REACTION_TTL_MS = 3500;

	useEffect(() => {
		const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
			let msg: {
				type?: string;
				raised?: boolean;
				raisedAt?: number;
				emoji?: string;
				reactionId?: string;
				participantId?: string;
				text?: string;
				isFinal?: boolean;
				/** A hand we are being told about again for our benefit, not one that has just gone up. */
				rebroadcast?: boolean;
				/** Who a `mute` is aimed at, by identity. Everyone receives it; only its target acts on it. */
				target?: string;
			};
			try {
				msg = JSON.parse(new TextDecoder().decode(payload));
			} catch {
				return;
			}
			if (msg.type === 'hand') {
				if (!participant) return;

				// Announced only on the way up, and only for a hand that was not already up. A hand held through a
				// reconnect, or rebroadcast to us because we arrived after it went up, is not news to announce — on
				// joining a call with several hands up it would announce each of them at once.
				//
				// Kept in a ref rather than read from the state below, because deciding inside a state updater
				// means deciding again every time React chooses to re-run it.
				if (msg.raised && !msg.rebroadcast && !announcedHandsRef.current.has(participant.identity)) {
					announcedHandsRef.current.add(participant.identity);
					playHandRaiseChime();
				}
				if (!msg.raised) {
					announcedHandsRef.current.delete(participant.identity);
				}

				setHandsMap((prev) => ({
					...prev,
					[participant.identity]: msg.raised ? msg.raisedAt || Date.now() : 0,
				}));
				return;
			}
			if (msg.type === 'mute') {
				// Everyone in the call receives this; only its target acts on it. Muting is done *here*, by the
				// microphone's own client, because that is the only place a microphone can actually be turned off —
				// and it is also what makes the ask honest rather than a claim to control someone's machine.
				if (msg.target !== localParticipant.identity) {
					return;
				}

				void localParticipant.setMicrophoneEnabled(false).catch((err: unknown) => {
					console.warn('mute request failed', err);
				});

				// Said plainly, and with a name: a microphone that goes quiet on its own reads as a bug, and the
				// person whose it is deserves to know it was someone's decision rather than a fault.
				dispatchToastMessage({
					type: 'info',
					message: t('You_were_muted_by__name__', { name: participant?.name || participant?.identity || t('User') }),
				});
				return;
			}
			if (msg.type === 'reaction' && msg.emoji) {
				const senderId = participant?.identity ?? localParticipant.identity;
				const now = Date.now();
				setActiveReactions((prev) => [
					...prev,
					{
						id: msg.reactionId || `${senderId}-${now}-${Math.random().toString(36).slice(2, 6)}`,
						participantId: senderId,
						emoji: msg.emoji as string,
						sentAt: now,
						expiresAt: now + REACTION_TTL_MS,
					},
				]);
			}
		};
		room.on(RoomEvent.DataReceived, onData);
		return () => {
			room.off(RoomEvent.DataReceived, onData);
		};
	}, [room, localParticipant, dispatchToastMessage, t]);

	// Sweep expired reactions out of state once a second so the lists stay
	// bounded. Interval (not setTimeout per entry) so concurrent reactions
	// don't fan out into many timers.
	useEffect(() => {
		if (activeReactions.length === 0) return undefined;
		const handle = setInterval(() => {
			const now = Date.now();
			setActiveReactions((prev) => {
				const next = prev.filter((r) => r.expiresAt > now);
				return next.length === prev.length ? prev : next;
			});
		}, 1000);
		return () => clearInterval(handle);
	}, [activeReactions.length]);

	const onSendReaction = useCallback(
		(emoji: string) => {
			const now = Date.now();
			const reactionId = `${localParticipant.identity}-${now}-${Math.random().toString(36).slice(2, 6)}`;
			// Render locally immediately — don't wait for the data-channel echo
			// (LK doesn't deliver our own messages back to us).
			setActiveReactions((prev) => [
				...prev,
				{
					id: reactionId,
					participantId: localParticipant.identity,
					emoji,
					sentAt: now,
					expiresAt: now + REACTION_TTL_MS,
				},
			]);
			const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji, reactionId }));
			void localParticipant.publishData(data, { reliable: false }).catch((err) => {
				console.warn('reaction publish failed', err);
			});
		},
		[localParticipant],
	);

	// Late joiners: rebroadcast our current hand state when someone new connects,
	// so they see us in the queue if we already had our hand up before they joined.
	useEffect(() => {
		if (!localHandRaised) return undefined;
		const rebroadcast = () => {
			const data = new TextEncoder().encode(
				JSON.stringify({ type: 'hand', raised: true, raisedAt: localRaisedAtRef.current, rebroadcast: true }),
			);
			void localParticipant.publishData(data, { reliable: true });
		};
		room.on(RoomEvent.ParticipantConnected, rebroadcast);
		return () => {
			room.off(RoomEvent.ParticipantConnected, rebroadcast);
		};
	}, [room, localParticipant, localHandRaised]);

	const onToggleHand = useCallback(() => {
		const raised = !localHandRaised;
		const raisedAt = raised ? Date.now() : 0;
		localRaisedAtRef.current = raisedAt;
		setLocalHandRaised(raised);
		if (raised) {
			playHandRaiseChime();
		}
		setHandsMap((prev) => ({ ...prev, [localParticipant.identity]: raisedAt }));
		const data = new TextEncoder().encode(JSON.stringify({ type: 'hand', raised, raisedAt }));
		void localParticipant.publishData(data, { reliable: true }).catch((err) => {
			console.warn('raise-hand publish failed', err);
		});
	}, [localHandRaised, localParticipant]);

	const onMuteParticipant = useCallback(
		(participantId: string) => {
			const data = new TextEncoder().encode(JSON.stringify({ type: 'mute', target: participantId }));
			void localParticipant.publishData(data, { reliable: true }).catch((err: unknown) => {
				console.warn('mute request publish failed', err);
			});
		},
		[localParticipant],
	);

	const raisedHands = useMemo(
		() =>
			Object.entries(handsMap)
				.filter(([, t]) => t > 0)
				.map(([id, raisedAt]) => ({ id, raisedAt }))
				.sort((a, b) => a.raisedAt - b.raisedAt),
		[handsMap],
	);

	// If a participant leaves, drop them from the queue so positions stay correct.
	useEffect(() => {
		const onDisconnect = (participant: RemoteParticipant) => {
			setHandsMap((prev) => {
				if (!(participant.identity in prev)) return prev;
				const { [participant.identity]: _drop, ...rest } = prev;
				return rest;
			});
		};
		room.on(RoomEvent.ParticipantDisconnected, onDisconnect);
		return () => {
			room.off(RoomEvent.ParticipantDisconnected, onDisconnect);
		};
	}, [room]);

	// "Someone joined" plink. Gated by call size so big calls don't get a
	// chime per joiner — the convention is to signal new arrivals only
	// while the call is small enough that each face still matters.
	// Threshold uses room.numParticipants (post-join, includes local) so
	// the chime fires for joiners 2 through 6 inclusive (call growing
	// 1→2, 2→3, 3→4, 4→5, 5→6), and goes silent from the 7th onward.
	// Agent participants never trigger it.
	const JOIN_CHIME_MAX_PARTICIPANTS = 6;
	useEffect(() => {
		const onConnect = (participant: RemoteParticipant) => {
			if (isAgentParticipant(participant)) return;
			if (room.numParticipants <= JOIN_CHIME_MAX_PARTICIPANTS) {
				playJoinChime();
			}
		};
		room.on(RoomEvent.ParticipantConnected, onConnect);
		return () => {
			room.off(RoomEvent.ParticipantConnected, onConnect);
		};
	}, [room]);

	// The speaker is the one choice the connection can't be opened with: `audio`/`video` capture options describe
	// tracks we publish, and an output device isn't one. So it is applied to the room once it exists, and again if
	// the user picks another.
	useEffect(() => {
		if (!speakerId) {
			return;
		}

		void room.switchActiveDevice('audiooutput', speakerId).catch((err: unknown) => {
			console.warn('speaker switch failed', err);
		});
	}, [room, speakerId]);

	// What the app records as the selected devices, made to agree with the devices the call is actually on.
	//
	// That record is only ever written from inside a call, so on the way in it answers with its own fallback — the
	// first device the browser happened to enumerate — and the microphone chosen in the preflight reads as
	// unselected in the menu, for a device that is very much in use. The room is the one that knows: its capture
	// defaults seed the active device, every switch updates it, and what it reports is the device obtained rather
	// than the one requested. So it is asked, and the record is corrected from it.
	useEffect(() => {
		const record = (kind: 'audioinput' | 'audiooutput') => {
			const deviceId = room.getActiveDevice(kind);
			if (!deviceId || recorded.current[kind] === deviceId) {
				return;
			}

			const device = (kind === 'audioinput' ? availableDevices?.audioInput : availableDevices?.audioOutput)?.find(
				({ id }) => id === deviceId,
			);
			if (!device) {
				return;
			}

			recorded.current[kind] = deviceId;

			if (kind === 'audioinput') {
				setInputDevice(device);
				return;
			}

			// The output setter insists on an element to put the sink on, and LiveKit has already set it on the ones
			// it renders — so this is only for the record. It throws where `setSinkId` does not exist (Firefox), and
			// a tick is not worth an exception.
			const audioElement = document.querySelector('audio');
			if (!audioElement) {
				delete recorded.current[kind];
				return;
			}

			try {
				setOutputDevice({ outputDevice: device, HTMLAudioElement: audioElement });
			} catch (err) {
				console.warn('speaker selection not recorded', err);
			}
		};

		const sync = () => {
			record('audioinput');
			record('audiooutput');
		};

		sync();
		room.on(RoomEvent.ActiveDeviceChanged, sync);
		return () => {
			room.off(RoomEvent.ActiveDeviceChanged, sync);
		};
	}, [room, availableDevices, setInputDevice, setOutputDevice]);

	// The camera the user last chose, tracked explicitly so the picker always shows
	// the right selection — the constraint-based derivation can miss updates when
	// LiveKit replaces the track without changing the publication's trackSid.
	const [pickedCameraId, setPickedCameraId] = useState<string | undefined>();

	// Switch the active camera (videoinput) through the LK Room — LK's
	// switchActiveDevice republishes the track on the chosen device so no
	// renegotiation is needed at our level. The method lives on Room (not
	// LocalParticipant) in livekit-client ≥1.6.
	const onVideoInputChange = useCallback(
		(deviceId: string) => {
			setPickedCameraId(deviceId);
			persistDevicePreference({ camId: deviceId });
			void room.switchActiveDevice('videoinput', deviceId).catch((err: unknown) => {
				console.warn('camera switch failed', err);
			});
		},
		[room, persistDevicePreference],
	);

	// The same for a microphone or a speaker picked *during* the call, which the in-call menu asks for through one
	// callback for both. Which kind it is comes from the device's own `type`, since that is all the menu knows about
	// it and `switchActiveDevice` has to be told which side it is switching.
	const onDeviceChange = useCallback(
		(device: Device) => {
			const kind = device.type === 'audiooutput' ? 'audiooutput' : 'audioinput';
			persistDevicePreference(kind === 'audiooutput' ? { speakerId: device.id } : { micId: device.id });

			void room.switchActiveDevice(kind, device.id).catch((err: unknown) => {
				console.warn(`${kind} switch failed`, err);
			});
		},
		[room, persistDevicePreference],
	);

	// Current camera deviceId — the explicitly picked one wins; otherwise derived
	// from the published track's constraints (safe when a processor is attached,
	// because the processed track reports an empty deviceId in getSettings()).
	const derivedCameraDeviceId = useMemo(() => {
		const pub = localParticipant.getTrackPublication(Track.Source.Camera);
		const track = pub?.track;
		return deviceIdFrom(track?.constraints?.deviceId) || track?.mediaStreamTrack?.getSettings().deviceId;
	}, [localParticipant, camEnabled, localCameraPub?.trackSid, localCameraPub?.track?.getProcessor()?.processedTrack]);

	const currentCameraDeviceId = pickedCameraId ?? derivedCameraDeviceId;

	const ctxValue = useMemo(
		() => ({
			sessionState: {
				state: 'ongoing' as const,
				connectionState: room.state === 'connected' ? 'CONNECTED' : 'CONNECTING',
				peerInfo: undefined,
				transferredBy: undefined,
				hidden: false,
				muted: !micEnabled,
				held: false,
				remoteMuted: false,
				remoteHeld: false,
				callId,
				startedAt,
				supportedFeatures: ['audio', 'video', 'screen-share'] as any,
			},
			onMute: onToggleMic,
			onHold: () => undefined,
			onDeviceChange,
			onForward: () => undefined,
			onTone: () => undefined,
			onEndCall: onLeave,
			onCall: () => Promise.resolve(),
			onAccept: () => Promise.resolve(),
			onSelectPeer: () => undefined,
			onToggleScreenSharing: onToggleScreen,
			onToggleCamera,
			onToggleHand,
			localHandRaised,
			raisedHands,
			onMuteParticipant,
			noiseSuppression,
			backgroundBlur,
			videoQuality,
			sendResolution,
			onSendReaction,
			activeReactions,
			onVideoInputChange,
			currentCameraDeviceId,
			speakingWhileMuted,
			remoteParticipants,
			streams: {
				localCamera: localCameraStream as any,
				localScreen: localScreenStream as any,
				localMicrophone: localMicrophoneStream as any,
			},
		}),
		[
			room.state,
			micEnabled,
			callId,
			startedAt,
			onToggleMic,
			onLeave,
			onToggleScreen,
			onToggleCamera,
			onToggleHand,
			localHandRaised,
			raisedHands,
			onMuteParticipant,
			noiseSuppression,
			backgroundBlur,
			videoQuality,
			sendResolution,
			onSendReaction,
			activeReactions,
			onDeviceChange,
			onVideoInputChange,
			currentCameraDeviceId,
			speakingWhileMuted,
			remoteParticipants,
			localCameraStream,
			localScreenStream,
			localMicrophoneStream,
		],
	);

	useEffect(() => {
		onContextChange(ctxValue);
	}, [ctxValue, onContextChange]);

	useEffect(() => {
		onDiagnosticsChange(diagnostics);
	}, [diagnostics, onDiagnosticsChange]);

	return null;
};

/**
 * App-level bridge for the LiveKit group-call connection. Always renders
 * children in the same React tree position (no remount on call start/end).
 * When a group call is active (per `useLiveKitVideoConf().activeCall`), the
 * LK Room mounts into a sibling portal and an inner bridge pushes the
 * populated MediaCallViewContext value upward via state. The result: the
 * per-room MediaCallRoomActivity (rendered with provider={null}) sees the
 * live LK context, and navigating between channels doesn't tear down LK.
 *
 * Note: this is a Video Conference feature and has zero dependency on the
 * VoIP MediaSignalingSession. Active-call state is owned by the sibling
 * LiveKitVideoConfProvider context.
 */
const LiveKitVideoConfBridge = ({ children }: { children: ReactNode }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { activeCall, leaveCall } = useLiveKitVideoConf();
	const callId = activeCall?.callId;
	const [creds, setCreds] = useState<LKCreds | null>(null);
	const [ctxValue, setCtxValue] = useState<unknown>(defaultMediaCallContextValue);
	const [diagnosticsValue, setDiagnosticsValue] = useState<unknown>(undefined);

	useEffect(() => {
		if (!callId) {
			setCreds(null);
			setCtxValue(defaultMediaCallContextValue);
			setDiagnosticsValue(undefined);
			return;
		}
		let cancelled = false;
		void fetchTransportConfig(callId)
			.then((c) => {
				if (!cancelled) setCreds(c);
			})
			// Nothing to connect to, so there is no call to sit in. Leaving says so — where staying would show a
			// call that looks live and answers nothing — and the toast is what names the reason.
			.catch((error) => {
				if (cancelled) {
					return;
				}
				dispatchToastMessage({ type: 'error', message: error });
				leaveCall();
			});
		return () => {
			cancelled = true;
		};
	}, [callId, dispatchToastMessage, leaveCall]);

	const onLeave = useCallback(() => {
		if (callId) {
			requestLeaveGroup(callId);
		}
		leaveCall();
	}, [leaveCall, callId]);

	// Tab close / refresh / browser kill: fire the leave REST with keepalive so the server marks this user gone
	// before the connection dies. Without it the departure waits on the presence lease expiring, and the room
	// header goes on offering the call to everyone else in the meantime.
	useEffect(() => {
		if (!callId) return;
		const handler = () => requestLeaveGroup(callId, { keepalive: true });
		window.addEventListener('pagehide', handler);
		return () => {
			window.removeEventListener('pagehide', handler);
		};
	}, [callId]);

	const lkActive = Boolean(callId && creds);

	// The LK Room mounts into a hidden, app-lifetime detached node so it isn't
	// part of any per-room DOM that might unmount on navigation. The React tree
	// position of children above stays untouched.
	const lkPortalTarget = useMemo(() => {
		if (typeof document === 'undefined') return null;
		const node = document.createElement('div');
		node.setAttribute('data-livekit-host', '');
		node.style.display = 'none';
		document.body.appendChild(node);
		return node;
	}, []);
	useEffect(() => {
		return () => {
			if (lkPortalTarget?.parentNode) lkPortalTarget.parentNode.removeChild(lkPortalTarget);
		};
	}, [lkPortalTarget]);

	const swm = (ctxValue as any).speakingWhileMuted === true;
	const [showSwm, setShowSwm] = useState(false);
	const swmTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const [swmRect, setSwmRect] = useState<{ left: number; bottom: number } | null>(null);

	useEffect(() => {
		if (swm) {
			if (swmTimer.current) clearTimeout(swmTimer.current);
			setShowSwm(true);
		} else if (showSwm) {
			swmTimer.current = setTimeout(() => setShowSwm(false), 3000);
		}
		return () => {
			if (swmTimer.current) clearTimeout(swmTimer.current);
		};
	}, [swm, showSwm]);

	useEffect(() => {
		if (!showSwm) {
			setSwmRect(null);
			return undefined;
		}
		const locate = () => {
			const btn = document.querySelector<HTMLElement>('[title="Unmute"], [title*="muted" i]');
			if (btn) {
				const r = btn.getBoundingClientRect();
				setSwmRect({ left: r.left + r.width / 2, bottom: window.innerHeight - r.top + 8 });
			}
		};
		locate();
		const id = setInterval(locate, 1000);
		return () => clearInterval(id);
	}, [showSwm]);

	return (
		<CallDiagnosticsContext.Provider value={diagnosticsValue as any}>
			<MediaCallViewContext.Provider value={ctxValue as any}>
				{children}
				{showSwm && swmRect && (
					<button
						type='button'
						style={{
							position: 'fixed',
							bottom: swmRect.bottom,
							left: swmRect.left,
							transform: 'translateX(-50%)',
							padding: '6px 12px',
							borderRadius: 4,
							border: 'none',
							background: 'rgba(235, 50, 50, 0.95)',
							color: '#fff',
							fontSize: 12,
							fontWeight: 500,
							lineHeight: 1.3,
							whiteSpace: 'nowrap' as const,
							zIndex: 99999,
							pointerEvents: 'auto' as const,
							cursor: 'pointer',
						}}
						onClick={(ctxValue as any).onMute}
					>
						You are muted — click to unmute
					</button>
				)}
				{lkActive && creds && callId && lkPortalTarget
					? createPortal(
							// Apply preflight mic/cam preferences from the VC
							// popup as the initial `audio` / `video` flags so the
							// LiveKitRoom publishes (or skips) tracks according
							// to what the user chose. Defaults match the legacy
							// behaviour: mic on, camera off.
							<LiveKitRoom
								token={creds.token}
								serverUrl={creds.serverUrl}
								connect={true}
								// Whether to arrive with each track published; *which* device it opens is a capture default below.
								audio={activeCall?.preferences?.mic ?? true}
								video={activeCall?.preferences?.cam ?? false}
								options={captureDefaults(activeCall?.preferences)}
								onDisconnected={onLeave}
							>
								<InnerProvider
									callId={callId}
									speakerId={activeCall?.preferences?.speakerId}
									serverUrl={creds.serverUrl}
									onLeave={onLeave}
									onContextChange={setCtxValue}
									onDiagnosticsChange={setDiagnosticsValue}
								/>
								<RoomAudioRenderer />
							</LiveKitRoom>,
							lkPortalTarget,
						)
					: null}
			</MediaCallViewContext.Provider>
		</CallDiagnosticsContext.Provider>
	);
};

export default LiveKitVideoConfBridge;
