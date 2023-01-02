import Ajv from 'ajv';

import type { ITeamMemberParams } from './ITeamMemberParams';

const ajv = new Ajv();

export type TeamsUpdateMemberProps = ({ teamId: string } | { teamName: string }) & {
	member: ITeamMemberParams;
};

const teamsUpdateMemberPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				member: {
					type: 'object',
					properties: {
						userId: {
							type: 'string',
						},
						roles: {
							type: 'array',
							items: {
								type: 'string',
							},
							nullable: true,
						},
					},
					required: ['userId'],
					additionalProperties: false,
				},
			},
			required: ['teamId', 'member'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: {
					type: 'string',
				},
				member: {
					type: 'object',
					properties: {
						userId: {
							type: 'string',
						},
						roles: {
							type: 'array',
							items: {
								type: 'string',
							},
							nullable: true,
						},
					},
					required: ['userId'],
					additionalProperties: false,
				},
			},
			required: ['teamName', 'member'],
			additionalProperties: false,
		},
	],
};

export const isTeamsUpdateMemberProps = ajv.compile<TeamsUpdateMemberProps>(teamsUpdateMemberPropsSchema);
