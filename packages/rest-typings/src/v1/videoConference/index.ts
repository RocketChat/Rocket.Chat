import type {
	VideoConferenceInstructions,
	VideoConference,
	VideoConferenceWithDiscussion,
	VideoConferenceCapabilities,
} from '@rocket.chat/core-typings';

import type { VideoConfAddParticipantsProps } from './VideoConfAddParticipantsProps';
import type { VideoConfCancelProps } from './VideoConfCancelProps';
import type { VideoConfInfoProps } from './VideoConfInfoProps';
import type { VideoConfJoinProps } from './VideoConfJoinProps';
import type { VideoConfListProps } from './VideoConfListProps';
import type { VideoConfStartProps } from './VideoConfStartProps';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export * from './VideoConfInfoProps';
export * from './VideoConfListProps';
export * from './VideoConfStartProps';
export * from './VideoConfJoinProps';
export * from './VideoConfCancelProps';
export * from './VideoConfAddParticipantsProps';

export type VideoConferenceEndpoints = {
	'/v1/video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions & { providerName: string } };
	};

	'/v1/video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string; providerName: string };
	};

	'/v1/video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};

	'/v1/video-conference.add-participants': {
		POST: (params: VideoConfAddParticipantsProps) => { rid: string };
	};

	'/v1/video-conference.info': {
		GET: (params: VideoConfInfoProps) => VideoConference & { capabilities: VideoConferenceCapabilities };
	};

	'/v1/video-conference.list': {
		GET: (params: VideoConfListProps) => PaginatedResult<{
			data: VideoConferenceWithDiscussion[];
		}>;
	};

	'/v1/video-conference.capabilities': {
		GET: () => { providerName: string; capabilities: VideoConferenceCapabilities };
	};

	'/v1/video-conference.providers': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
