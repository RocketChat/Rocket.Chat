import { TeamType } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type TeamsCreateProps = {
	name: string;
	type: TeamType;
	members?: string[];
	room?: {
		id?: string;
		name?: string;
		members?: string[];
		readOnly?: boolean;
		extraData?: Record<string, string | boolean>;
		options?: {
			forceNew?: boolean;
			creator?: string;
			subscriptionExtra?: {
				open: boolean;
				ls?: string | Date;
				prid?: string;
				roles?: string[];
			};
		};
	};
	owner?: string;
};

const teamsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			minLength: 1,
		},
		type: {
			type: 'number',
			enum: [TeamType.PUBLIC, TeamType.PRIVATE],
		},
		members: {
			type: 'array',
			items: {
				type: 'string',
				minLength: 1,
			},
			uniqueItems: true,
		},
		room: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				members: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				readOnly: {
					type: 'boolean',
				},
				extraData: {
					type: 'object',
					additionalProperties: {
						oneOf: [{ type: 'string' }, { type: 'boolean' }],
					},
				},
				options: {
					type: 'object',
					properties: {
						forceNew: { type: 'boolean' },
						creator: { type: 'string' },
						subscriptionExtra: {
							type: 'object',
							properties: {
								open: { type: 'boolean' },
								ls: { oneOf: [{ type: 'string' }, { type: 'object' }] },
								prid: { type: 'string' },
								roles: { type: 'array', items: { type: 'string' } },
							},
							required: ['open'],
							additionalProperties: false,
						},
					},
					additionalProperties: false,
				},
			},
			additionalProperties: false,
		},
		owner: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['name', 'type'],
	additionalProperties: false,
};

export const isTeamsCreateProps = ajv.compile<TeamsCreateProps>(teamsCreatePropsSchema);
