import { type IMediaStreamWrapper } from '@rocket.chat/media-signaling';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { SessionState, PeerInfo } from './definitions';
import { type LastKnownPosition } from '../providers/useWidgetPositionTracker';

export type MediaCallStreams = {
	remoteScreen?: IMediaStreamWrapper;
	localScreen?: IMediaStreamWrapper;
	remoteCamera?: IMediaStreamWrapper;
	localCamera?: IMediaStreamWrapper;
	/** Local microphone stream — used to drive the local speaking indicator. */
	localMicrophone?: IMediaStreamWrapper;
	/**
	 * Remote microphone stream — used to drive the remote speaking indicator
	 * on 1:1 P2P calls. Group calls (LK) attach audioStream per-participant on
	 * RemoteParticipantInfo instead.
	 */
	remoteMicrophone?: IMediaStreamWrapper;
};

/**
 * One remote participant in a media call. The room section iterates this list
 * regardless of whether the call is 1:1 (length 1) or a group call (N peers).
 */
export type RemoteParticipantInfo = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream;
	screenStream?: MediaStream;
	/** Microphone MediaStream — drives the per-tile speaking indicator. */
	audioStream?: MediaStream;
};

type MediaCallViewContextValue = {
	sessionState: SessionState;
	onClickDirectMessage?: () => void;
	onMute: () => void;
	onHold: () => void;
	onDeviceChange: (device: Device) => void;
	onForward: () => void;
	onTone: (tone: string) => void;
	onEndCall: () => void;
	onCall: () => Promise<void>;
	onAccept: () => Promise<void>;
	onSelectPeer: (peerInfo: PeerInfo) => void;
	onToggleScreenSharing: () => void;
	// Camera toggling is a Video Conference feature (LiveKit). The 1:1 VoIP
	// path doesn't supply this, so consumers must handle undefined.
	onToggleCamera?: () => void;
	/**
	 * Toggle the local user's "raise hand" state. Group calls broadcast this
	 * over the LK data channel; direct calls only track it locally.
	 */
	onToggleHand?: () => void;
	/** Whether the local user currently has their hand raised. */
	localHandRaised?: boolean;
	/**
	 * All raised hands across the call, ordered by raise time (oldest first).
	 * The index + 1 is the queue position rendered on the participant tile.
	 */
	raisedHands?: { id: string; raisedAt: number }[];
	/**
	 * Currently-active reactions across the call. The provider auto-removes
	 * each one after its `expiresAt`. Indexed by sender participant id so the
	 * UI can render the emoji on the sender's tile.
	 */
	activeReactions?: { id: string; participantId: string; emoji: string; sentAt: number; expiresAt: number }[];
	/** Send a reaction emoji from the local user. */
	onSendReaction?: (emoji: string) => void;
	/**
	 * Latest caption text per participant. Populated by the transcription
	 * agent (see apps/livekit-agent) via LK data messages — interim updates
	 * supersede each other; final transcripts replace and then expire after
	 * a short delay. Indexed by speaker id so the UI can overlay captions
	 * on the matching tile.
	 */
	activeCaptions?: Record<string, { text: string; isFinal: boolean; updatedAt: number }>;
	/**
	 * Whether the local user has opted in to see live captions. Per-user
	 * (does NOT propagate to other participants' UIs). When true, the
	 * provider also broadcasts a "captions-request" signal so the agent
	 * starts transcribing — captions are only processed + transmitted while
	 * at least one participant in the call has captions enabled.
	 */
	captionsEnabledLocally?: boolean;
	/** Toggle the local user's caption opt-in. */
	onToggleCaptions?: () => void;
	/**
	 * Selected call language (BCP-47 code + English label). Shared across
	 * all participants via the LK data channel — when any participant flips
	 * it the agent restarts active transcribers with the new language so
	 * captions and persisted transcripts both stay consistent. Defaults to
	 * English (US).
	 */
	callLanguage?: { code: string; label: string };
	/** Change the call's language. Broadcasts to peers + agent. */
	onChangeCallLanguage?: (code: string) => void;
	/**
	 * Switch the active camera input (videoinput device). Only meaningful when
	 * the underlying transport supports live device switching — currently
	 * wired by the LiveKit provider. P2P providers may leave this undefined,
	 * in which case the camera-chevron menu won't render.
	 */
	onVideoInputChange?: (deviceId: string) => void;
	/** Currently-active camera deviceId, used to mark the selected entry in the picker. */
	currentCameraDeviceId?: string;
	/**
	 * Reactive recording/transcription state shared via the LK data channel.
	 * Lets the action strip subscribe to state changes broadcast by other
	 * participants without polling the server. `undefined` means "unknown
	 * yet" (the local one-shot fetch hasn't completed and no broadcast has
	 * arrived); `null`-like absence collapses to disabled at the UI layer.
	 */
	liveRecordingActive?: { isRecording: boolean; updatedAt: number };
	liveTranscriptionActive?: { enabled: boolean; updatedAt: number };
	/**
	 * Broadcast a state change for recording / transcription to all
	 * participants. Toggling clients call these after their REST call
	 * succeeds; other clients receive the data-channel message and update
	 * their local UI without needing to poll.
	 */
	broadcastRecordingState?: (isRecording: boolean) => void;
	broadcastTranscriptionState?: (enabled: boolean) => void;
	streams: MediaCallStreams;
	/**
	 * Remote participants in the call. Populated by the VC LiveKit bridge for
	 * group calls (length N). The 1:1 VoIP path doesn't supply this; consumers
	 * default to an empty array.
	 */
	remoteParticipants?: RemoteParticipantInfo[];
	widgetPositionTracker?: {
		onChangePosition: (position: LastKnownPosition | null) => void;
		getRestorePosition: () => LastKnownPosition | null;
	};
};

const defaultSessionState: SessionState = {
	state: 'closed',
	connectionState: 'CONNECTED',
	peerInfo: undefined,
	transferredBy: undefined,
	hidden: false,
	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,
	callId: undefined,
	supportedFeatures: ['audio', 'transfer', 'hold'],
};

export const defaultMediaCallContextValue: MediaCallViewContextValue = {
	sessionState: defaultSessionState,
	onMute: () => undefined,
	onHold: () => undefined,
	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,
	onEndCall: () => undefined,
	onCall: () => Promise.resolve(undefined),
	onAccept: () => Promise.resolve(undefined),
	onSelectPeer: () => undefined,
	onToggleScreenSharing: () => undefined,
	onToggleCamera: () => undefined,
	streams: {},
	remoteParticipants: [],
};

const MediaCallViewContext = createContext<MediaCallViewContextValue>(defaultMediaCallContextValue);

export const useMediaCallView = (): MediaCallViewContextValue => useContext(MediaCallViewContext);

export default MediaCallViewContext;
