import type { IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type TeamsRemoveRoomProps = ({ teamId: string } | { teamName: string }) & {
	roomId: IRoom['_id'];
};

export const teamsRemoveRoomPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				roomId: {
					type: 'string',
				},
			},
			required: ['teamId', 'roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: {
					type: 'string',
				},
				roomId: {
					type: 'string',
				},
			},
			required: ['teamName', 'roomId'],
			additionalProperties: false,
		},
	],
};

export const isTeamsRemoveRoomProps = ajv.compile<TeamsRemoveRoomProps>(teamsRemoveRoomPropsSchema);
