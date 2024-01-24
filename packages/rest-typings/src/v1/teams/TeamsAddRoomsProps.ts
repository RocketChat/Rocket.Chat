import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsAddRoomsProps = { rooms: IRoom['_id'][]; teamId: string } | { rooms: IRoom['_id'][]; teamName: string };

const teamsAddRoomsPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				rooms: { type: 'array', items: { type: 'string' } },
				teamId: { type: 'string' },
			},
			required: ['teamId', 'rooms'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				rooms: { type: 'array', items: { type: 'string' } },
				teamName: { type: 'string' },
			},
			required: ['teamName', 'rooms'],
			additionalProperties: false,
		},
	],
};

export const isTeamsAddRoomsProps = ajv.compile<TeamsAddRoomsProps>(teamsAddRoomsPropsSchema);
