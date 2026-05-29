/* eslint-disable react/no-multi-comp */
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useRoomContext, useTracks } from '@livekit/components-react';
import { MediaCallViewContext, useMediaCallInstance, type RemoteParticipantInfo } from '@rocket.chat/ui-voip';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { LocalAudioTrack, RemoteParticipant } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const headersOf = () => ({
	'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
	'X-User-Id': localStorage.getItem('Meteor.userId') || '',
});

type LKCreds = { serverUrl: string; token: string; roomName: string };

const fetchTransportConfig = async (callId: string): Promise<LKCreds | null> => {
	const res = await fetch(`/api/v1/media-calls.transport.config?callId=${encodeURIComponent(callId)}`, {
		headers: headersOf(),
	});
	if (!res.ok) return null;
	const data = (await res.json()) as { service: string; livekit?: LKCreds };
	return data.service === 'livekit' && data.livekit ? data.livekit : null;
};

/**
 * Tell the server the user has left this group call. Best-effort: server-side
 * is idempotent, and the call doc only closes once participants is empty, so
 * a missed leave just delays cleanup until expiresAt.
 *
 * `keepalive` lets this complete after a page-unload tear-down (when the user
 * closes the tab); inside the running app a normal fetch is fine.
 */
const requestLeaveGroup = (callId: string, opts?: { keepalive?: boolean }) => {
	try {
		void fetch('/api/v1/media-calls.leaveGroup', {
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
 * Inner provider: lives inside <LiveKitRoom>. Reads LK hooks and populates
 * MediaCallViewContext so the shared MediaCallRoomSection renders.
 */
const InnerProvider = ({ children, callId, onLeave }: { children: ReactNode; callId: string; onLeave: () => void }) => {
	const room = useRoomContext();
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

	const remotes = useMemo(
		() => allParticipants.filter((p) => p.identity !== localParticipant.identity),
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
			return {
				id: p.identity,
				displayName: p.name || p.identity,
				avatarUrl: getUserAvatarPath({ userId: p.identity }),
				muted: Boolean(!micPub || micPub.isMuted),
				held: false,
				cameraStream: cam?.publication?.track?.mediaStream,
				screenStream: scr?.publication?.track?.mediaStream,
				audioStream: aud?.publication?.track?.mediaStream,
			};
		});
	}, [remotes, remoteCameraTracks, remoteScreenTracks, remoteAudioTracks, getUserAvatarPath]);

	const localCameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
	const localScreenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
	const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
	const localCameraStream = useMemo(
		() => (localCameraPub?.track?.mediaStream ? { active: camEnabled, stream: localCameraPub.track.mediaStream } : undefined),
		[localCameraPub?.track?.mediaStream, camEnabled],
	);
	const localScreenStream = useMemo(
		() => (localScreenPub?.track?.mediaStream ? { active: screenEnabled, stream: localScreenPub.track.mediaStream } : undefined),
		[localScreenPub?.track?.mediaStream, screenEnabled],
	);
	const localMicrophoneStream = useMemo(
		() => (localMicPub?.track?.mediaStream ? { active: micEnabled, stream: localMicPub.track.mediaStream } : undefined),
		[localMicPub?.track?.mediaStream, micEnabled],
	);

	// Apply Krisp noise filter to the local mic track whenever it's (re)published.
	// Dynamic import keeps the WASM bundle out of the main JS chunk; if loading or
	// support detection fails we silently fall back to the raw mic — the filter is
	// quality-of-life, not load-bearing.
	useEffect(() => {
		const audioTrack = localMicPub?.track as LocalAudioTrack | undefined;
		if (!audioTrack) {
			console.debug('[Krisp] no local mic track yet, skipping');
			return;
		}
		if (typeof audioTrack.setProcessor !== 'function') {
			console.warn('[Krisp] setProcessor not available on this livekit-client version');
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				console.debug('[Krisp] loading module…');
				const mod = await import('@livekit/krisp-noise-filter');
				if (cancelled) return;
				const supported = mod.isKrispNoiseFilterSupported();
				console.debug('[Krisp] supported?', supported);
				if (!supported) return;
				console.debug('[Krisp] attaching processor to track', audioTrack.sid);
				await audioTrack.setProcessor(mod.KrispNoiseFilter());
				console.info('[Krisp] processor attached');
			} catch (err) {
				console.warn('[Krisp] noise filter unavailable', err);
			}
		})();
		return () => {
			cancelled = true;
			void audioTrack.stopProcessor?.().catch(() => undefined);
		};
	}, [localMicPub?.track]);

	const onToggleMic = useCallback(() => void localParticipant.setMicrophoneEnabled(!micEnabled), [localParticipant, micEnabled]);
	const onToggleCamera = useCallback(() => void localParticipant.setCameraEnabled(!camEnabled), [localParticipant, camEnabled]);
	const onToggleScreen = useCallback(() => void localParticipant.setScreenShareEnabled(!screenEnabled), [localParticipant, screenEnabled]);

	// Raise-hand state, broadcast over the LK data channel. raisedAt is used to
	// sort the queue position shown on the tile. A late-joining peer only sees
	// hands that are raised after they join (LK data channel doesn't replay).
	const [handsMap, setHandsMap] = useState<Record<string, number>>({});
	const [localHandRaised, setLocalHandRaised] = useState(false);
	const localRaisedAtRef = useRef(0);

	useEffect(() => {
		const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
			if (!participant) return;
			let msg: { type?: string; raised?: boolean; raisedAt?: number };
			try {
				msg = JSON.parse(new TextDecoder().decode(payload));
			} catch {
				return;
			}
			if (msg.type !== 'hand') return;
			setHandsMap((prev) => ({
				...prev,
				[participant.identity]: msg.raised ? msg.raisedAt || Date.now() : 0,
			}));
		};
		room.on(RoomEvent.DataReceived, onData);
		return () => {
			room.off(RoomEvent.DataReceived, onData);
		};
	}, [room]);

	// Late joiners: rebroadcast our current hand state when someone new connects,
	// so they see us in the queue if we already had our hand up before they joined.
	useEffect(() => {
		if (!localHandRaised) return undefined;
		const rebroadcast = () => {
			const data = new TextEncoder().encode(
				JSON.stringify({ type: 'hand', raised: true, raisedAt: localRaisedAtRef.current }),
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
		setHandsMap((prev) => ({ ...prev, [localParticipant.identity]: raisedAt }));
		const data = new TextEncoder().encode(JSON.stringify({ type: 'hand', raised, raisedAt }));
		void localParticipant.publishData(data, { reliable: true }).catch((err) => {
			console.warn('raise-hand publish failed', err);
		});
	}, [localHandRaised, localParticipant]);

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
			onDeviceChange: () => undefined,
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
			remoteParticipants,
			localCameraStream,
			localScreenStream,
			localMicrophoneStream,
		],
	);

	return <MediaCallViewContext.Provider value={ctxValue as any}>{children}</MediaCallViewContext.Provider>;
};

/**
 * Drop-in replacement for MediaCallViewProvider for group calls. Reads the
 * current group call from MediaSignalingSession, fetches its LiveKit creds
 * on first mount, opens the LiveKit room, then provides MediaCallViewContext
 * to MediaCallRoomSection (which renders identical UI for 1:1 and group).
 */
const LiveKitMediaCallProvider = ({ children }: { children: ReactNode }) => {
	const { instance: session } = useMediaCallInstance();
	const call = session?.getState(false)?.call as any;
	const callId = call?.callId as string | undefined;
	const [creds, setCreds] = useState<LKCreds | null>(null);

	useEffect(() => {
		if (!callId) {
			setCreds(null);
			return;
		}
		let cancelled = false;
		void fetchTransportConfig(callId).then((c) => {
			if (!cancelled) setCreds(c);
		});
		return () => {
			cancelled = true;
		};
	}, [callId]);

	const onLeave = useCallback(() => {
		if (callId) {
			requestLeaveGroup(callId);
		}
		session?.leaveGroupCall();
	}, [session, callId]);

	// Tab close / refresh / browser kill: fire the leave REST with keepalive so
	// the server clears this user from participants[] before the connection
	// dies. Without this the call doc stays "active" until expiresAt (8h) and
	// the room header keeps showing "Join Call" for everyone else.
	useEffect(() => {
		if (!callId) return;
		const handler = () => requestLeaveGroup(callId, { keepalive: true });
		window.addEventListener('pagehide', handler);
		return () => {
			window.removeEventListener('pagehide', handler);
		};
	}, [callId]);

	if (!callId || !creds) {
		return <>{children}</>;
	}

	return (
		<LiveKitRoom
			token={creds.token}
			serverUrl={creds.serverUrl}
			connect={true}
			audio={true}
			video={false}
			onDisconnected={onLeave}
			style={{ display: 'contents' }}
		>
			<InnerProvider callId={callId} onLeave={onLeave}>
				{children}
			</InnerProvider>
			<RoomAudioRenderer />
		</LiveKitRoom>
	);
};

export default LiveKitMediaCallProvider;
