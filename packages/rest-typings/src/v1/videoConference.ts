import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type VideoConferenceJitsiUpdateTimeout = { roomId: IRoom['_id']; joiningNow?: boolean };

const VideoConferenceJitsiUpdateTimeoutSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		joiningNow: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConferenceJitsiUpdateTimeoutProps = ajv.compile<VideoConferenceJitsiUpdateTimeout>(
	VideoConferenceJitsiUpdateTimeoutSchema,
);

export type VideoConferenceEndpoints = {
	'/v1/video-conference/jitsi.update-timeout': {
		POST: (params: VideoConferenceJitsiUpdateTimeout) => {
			jitsiTimeout: number;
		};
	};
};
