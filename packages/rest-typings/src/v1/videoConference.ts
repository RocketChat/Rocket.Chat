import type { IRoom } from '@rocket.chat/core-typings';

export type VideoConferenceEndpoints = {
	'/v1/video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: IRoom['_id']; joiningNow?: boolean }) => {
			jitsiTimeout: number;
		};
	};
};
