import { ajv } from '../Ajv';

export type TeamsAddRoomsProps = ({ teamId: string } | { teamName: string }) & {
	rooms: string[];
};

const teamsAddRoomsPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: { type: 'string' },
				rooms: { type: 'array', items: { type: 'string' }, minItems: 1 },
			},
			required: ['teamId', 'rooms'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: { type: 'string' },
				rooms: { type: 'array', items: { type: 'string' }, minItems: 1 },
			},
			required: ['teamName', 'rooms'],
			additionalProperties: false,
		},
	],
};

export const isTeamsAddRoomsProps = ajv.compile<TeamsAddRoomsProps>(teamsAddRoomsPropsSchema);
