import { ajv } from '../Ajv';

export type TeamsCreateProps = {
	name: string;
	type: 0 | 1;
	members?: string[];
	room?: Record<string, unknown> & { name?: string; id?: string };
	owner?: string;
};

const teamsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'number', enum: [0, 1] },
		members: {
			type: 'array',
			items: { type: 'string' },
		},
		room: {
			type: 'object',
		},
		owner: { type: 'string' },
	},
	required: ['name', 'type'],
	additionalProperties: false,
};

export const isTeamsCreateProps = ajv.compile<TeamsCreateProps>(teamsCreatePropsSchema);
