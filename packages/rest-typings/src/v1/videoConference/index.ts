import type {
	VideoConferenceInstructions,
	VideoConference,
	VideoConferenceCapabilities,
	VideoConferenceChatAccess,
	VideoConferenceWithDiscussion,
} from '@rocket.chat/core-typings';

import type { VideoConfAddParticipantsProps } from './VideoConfAddParticipantsProps';
import type { VideoConfCancelProps } from './VideoConfCancelProps';
import type { VideoConfDeclineProps } from './VideoConfDeclineProps';
import type { VideoConfInfoProps } from './VideoConfInfoProps';
import type { VideoConfJoinProps } from './VideoConfJoinProps';
import type { VideoConfLeaveProps } from './VideoConfLeaveProps';
import type { VideoConfListProps } from './VideoConfListProps';
import type { VideoConfRingProps } from './VideoConfRingProps';
import type { VideoConfShareChatProps } from './VideoConfShareChatProps';
import type { VideoConfStartProps } from './VideoConfStartProps';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export * from './VideoConfInfoProps';
export * from './VideoConfListProps';
export * from './VideoConfStartProps';
export * from './VideoConfJoinProps';
export * from './VideoConfLeaveProps';
export * from './VideoConfRingProps';
export * from './VideoConfCancelProps';
export * from './VideoConfAddParticipantsProps';
export * from './VideoConfDeclineProps';
export * from './VideoConfShareChatProps';

export type VideoConferenceEndpoints = {
	'/v1/video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions & { providerName: string } };
	};

	'/v1/video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string; providerName: string };
	};

	/** Records that the caller left the call, ending the conference when nobody is left in it. */
	'/v1/video-conference.leave': {
		POST: (params: VideoConfLeaveProps) => void;
	};

	/** Rings the members who aren't in the call again; returns the ids actually rung. */
	'/v1/video-conference.ring': {
		POST: (params: VideoConfRingProps) => { rang: string[] };
	};

	'/v1/video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};

	'/v1/video-conference.decline': {
		POST: (params: VideoConfDeclineProps) => void;
	};

	'/v1/video-conference.add-participants': {
		POST: (params: VideoConfAddParticipantsProps) => { added: string[] };
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

	'/v1/video-conference.list': {
		GET: (params: VideoConfListProps) => PaginatedResult<{ data: VideoConferenceWithDiscussion[] }>;
	};

	'/v1/video-conference.capabilities': {
		GET: () => { providerName: string; capabilities: VideoConferenceCapabilities };
	};

	'/v1/video-conference.providers': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
