import type { ITeamMemberParams } from './ITeamMemberParams';
import { ajv } from '../Ajv';

export type TeamsUpdateMemberProps = ({ teamId: string } | { teamName: string }) & {
	member: ITeamMemberParams;
};

const teamsUpdateMemberPropsSchema = {
	type: 'object',
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
