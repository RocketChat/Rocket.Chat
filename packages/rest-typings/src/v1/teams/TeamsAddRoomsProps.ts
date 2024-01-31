import type { IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type TeamsAddRoomsProps = { rooms: IRoom['_id'][]; teamId: string } | { rooms: IRoom['_id'][]; teamName: string };

const teamsAddRoomsPropsSchema = {
	type: 'object',
	properties: {
		rooms: { type: 'array', items: { type: 'string' } },
		teamId: { type: 'string' },
		teamName: { type: 'string' },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: false,
};

export const isTeamsAddRoomsProps = ajv.compile<TeamsAddRoomsProps>(teamsAddRoomsPropsSchema);
