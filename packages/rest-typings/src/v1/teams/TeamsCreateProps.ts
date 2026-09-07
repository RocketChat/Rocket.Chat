import { ajv } from '../Ajv';

export type TeamsCreateProps = {
	name: string;
	type: 0 | 1;
	members?: string[];
	room?: Record<string, unknown> & { name?: string; id?: string };
	owner?: string;
	abacAttributes?: Record<string, string[]>;
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
		abacAttributes: {
			// ABAC-P4 — attribute key → values for the team's main room, so it is never briefly
			// locked between being created and being given its attributes. Top-level for the same
			// reason as on `channels.create` and `groups.create`: `room.extraData` is spread into
			// `createRoom` verbatim, and these have to be validated against the caller's authority
			// before the insert rather than written straight through.
			type: 'object',
			propertyNames: { type: 'string', pattern: '^[A-Za-z0-9_-]+$' },
			maxProperties: 10,
			additionalProperties: {
				type: 'array',
				items: { type: 'string', minLength: 1, pattern: '^[A-Za-z0-9_-]+$' },
				maxItems: 10,
				uniqueItems: true,
			},
		},
	},
	required: ['name', 'type'],
	additionalProperties: false,
};

export const isTeamsCreateProps = ajv.compile<TeamsCreateProps>(teamsCreatePropsSchema);
