import type { ITeamCreateRoom } from '@rocket.chat/core-services';
import type { ITeam, IUser } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsCreateProps = {
	name: ITeam['name'];
	type: ITeam['type'];
	members?: IUser['_id'][];
	room: ITeamCreateRoom;
	owner?: IUser['_id'];
};

export const teamsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'number', enum: Object.values(TEAM_TYPE) },
		members: { type: 'array', items: { type: 'string' } },
		owner: { type: 'string' },
		room: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				members: { type: 'array', items: { type: 'string' } },
				readOnly: { type: 'boolean' },
				extraData: {
					type: 'object',
					properties: {
						teamId: { type: 'string' },
						teamMain: { type: 'boolean' },
					},
					additionalProperties: true,
				},
				options: {
					type: 'object',
					properties: {
						nameValidationRegex: { type: 'string' },
						creator: { type: 'string' },
						subscriptionExtra: {
							type: 'object',
							properties: {
								open: { type: 'boolean' },
								ls: { type: 'string', format: 'iso-date-time' },
								prid: { type: 'string' },
								roles: { type: 'array', item: { type: 'string' } },
							},
							required: ['open'],
						},
					},
					additionalProperties: true,
				},
			},
		},
	},
	required: ['name', 'type'],
	additionalProperties: false,
};

export const isTeamsCreateProps = ajv.compile<TeamsCreateProps>(teamsCreatePropsSchema);
