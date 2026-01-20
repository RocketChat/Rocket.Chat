import { TeamType } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsUpdateProps = ({ teamId: string } | { teamName: string }) & {
	data:
		| {
				name: string;
				type?: TeamType;
		  }
		| {
				name?: string;
				type: TeamType;
		  };
};

const teamsUpdatePropsSchema = {
	type: 'object',
	properties: {
		updateRoom: {
			type: 'boolean',
			nullable: true,
		},
		teamId: {
			type: 'string',
			nullable: true,
		},
		teamName: {
			type: 'string',
			nullable: true,
		},
		data: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					nullable: true,
				},
				type: {
					type: 'number',
					enum: [TeamType.PUBLIC, TeamType.PRIVATE],
				},
			},
			additionalProperties: false,
			required: [],
			anyOf: [
				{
					required: ['name'],
				},
				{
					required: ['type'],
				},
			],
		},
		name: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	oneOf: [
		{
			required: ['teamId', 'data'],
		},
		{
			required: ['teamName', 'data'],
		},
	],
	additionalProperties: false,
};

export const isTeamsUpdateProps = ajv.compile<TeamsUpdateProps>(teamsUpdatePropsSchema);
