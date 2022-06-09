import type { VideoConferenceInstructions, VideoConference } from '@rocket.chat/core-typings';

import type { VideoConfInfoProps } from './VideoConfInfoProps';
import type { VideoConfListProps } from './VideoConfListProps';
import type { VideoConfStartProps } from './VideoConfStartProps';
import type { VideoConfJoinProps } from './VideoConfJoinProps';
import type { VideoConfCancelProps } from './VideoConfCancelProps';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export * from './VideoConfInfoProps';
export * from './VideoConfListProps';
export * from './VideoConfStartProps';
export * from './VideoConfJoinProps';
export * from './VideoConfCancelProps';

export type VideoConferenceEndpoints = {
	'video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions };
	};

	'video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string };
	};

	'video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};

	'video-conference.info': {
		GET: (params: VideoConfInfoProps) => VideoConference;
	};

	'video-conference.list': {
		GET: (params: VideoConfListProps) => PaginatedResult<{ data: VideoConference[] }>;
	};

	'video-conference.providers': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
