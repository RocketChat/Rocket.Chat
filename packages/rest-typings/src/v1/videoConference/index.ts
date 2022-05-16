import type { IRoom, VideoConferenceInstructions } from '@rocket.chat/core-typings';

import type { VideoConfStartProps } from './VideoConfStartProps';
import type { VideoConfJoinProps } from './VideoConfJoinProps';
import type { VideoConfCancelProps } from './VideoConfCancelProps';

export * from './VideoConfStartProps';
export * from './VideoConfJoinProps';
export * from './VideoConfCancelProps';

export type VideoConferenceEndpoints = {
	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: IRoom['_id']; joiningNow?: boolean }) => {
			jitsiTimeout: number;
		};
	};

	'video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions };
	};

	'video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string };
	};

	'video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};
};
