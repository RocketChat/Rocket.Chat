import type {
	JoinableVideoConference,
	VideoConferenceInstructions,
	VideoConference,
	VideoConferenceCapabilities,
	VideoConferenceChatAccess,
} from '@rocket.chat/core-typings';

import type { VideoConfAddParticipantsProps } from './VideoConfAddParticipantsProps.js';
import type { VideoConfCallIdProps } from './VideoConfCallIdProps.js';
import type { VideoConfInfoProps } from './VideoConfInfoProps.js';
import type { VideoConfJoinProps } from './VideoConfJoinProps.js';
import type { VideoConfListProps } from './VideoConfListProps.js';
import type { VideoConfRenameProps } from './VideoConfRenameProps.js';
import type { VideoConfRingProps } from './VideoConfRingProps.js';
import type { VideoConfShareChatProps } from './VideoConfShareChatProps.js';
import type { VideoConfStartProps } from './VideoConfStartProps.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

export * from './VideoConfInfoProps.js';
export * from './VideoConfListProps.js';
export * from './VideoConfStartProps.js';
export * from './VideoConfJoinProps.js';
export * from './VideoConfRingProps.js';
export * from './VideoConfCallIdProps.js';
export * from './VideoConfAddParticipantsProps.js';
export * from './VideoConfShareChatProps.js';
export * from './VideoConfRenameProps.js';

export type VideoConferenceEndpoints = {
	'/v1/video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions & { providerName: string } };
	};

	'/v1/video-conference.join': {
		// Embedded providers (e.g. LiveKit) return an empty `url` and include
		// `callId` + `rid` instead — the client routes the join into the
		// embedded provider's React context rather than opening a popup URL.
		POST: (params: VideoConfJoinProps) => { url: string; providerName: string; callId?: string; rid?: string };
	};

	/** Records that the caller left the call, ending the conference when nobody is left in it. */
	'/v1/video-conference.leave': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	/**
	 * Renews the caller's presence lease on the call. Leaving is inferred from these stopping, so that a departure
	 * nobody could report — a workspace outage, a crashed tab — is still recorded.
	 */
	'/v1/video-conference.heartbeat': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	/** Rings one member who isn't in the call again; says whether the ring actually went out. */
	'/v1/video-conference.ring': {
		POST: (params: VideoConfRingProps) => { rang: boolean };
	};

	/**
	 * What a member needs to set their call up. The provider's own key is present only when that provider needs
	 * configuring: `livekit` carries the server, a token for this user and the room to join.
	 */
	'/v1/video-conference.callConfig': {
		GET: (params: { callId: string }) => {
			providerName: string;
			livekit?: { serverUrl: string; token: string; roomName: string };
		};
	};

	'/v1/video-conference.cancel': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	'/v1/video-conference.decline': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	'/v1/video-conference.add-participants': {
		POST: (params: VideoConfAddParticipantsProps) => { added: string[] };
	};

	/** Renames a running group conference. Only the person who started it may. */
	'/v1/video-conference.rename': {
		POST: (params: VideoConfRenameProps) => void;
	};

	'/v1/video-conference.share-chat': {
		POST: (params: VideoConfShareChatProps) => { rid: string };
	};

	'/v1/video-conference.info': {
		GET: (params: VideoConfInfoProps) => VideoConference & {
			capabilities: VideoConferenceCapabilities;
			/** Where the chat lives, who among the members cannot read it, and how that can be resolved. */
			chatAccess: VideoConferenceChatAccess;
		};
	};

	/** The calls running now that the caller may join — how a call is reached without catching its ring. */
	'/v1/video-conference.joinable': {
		GET: () => { calls: JoinableVideoConference[] };
	};

	'/v1/video-conference.list': {
		GET: (params: VideoConfListProps) => PaginatedResult<{ data: VideoConference[] }>;
	};

	'/v1/video-conference.capabilities': {
		GET: () => { providerName: string; capabilities: VideoConferenceCapabilities };
	};

	'/v1/video-conference.providers': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
