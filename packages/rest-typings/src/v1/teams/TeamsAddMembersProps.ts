import type { ITeamMemberParams } from './ITeamMemberParams';
import { ajv } from '../../helpers/schemas';

export type TeamsAddMembersProps = ({ teamId: string } | { teamName: string }) & {
	members: ITeamMemberParams[];
};
const teamsAddMembersPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				members: {
					type: 'array',
					items: {
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
					minItems: 1,
					uniqueItems: true,
				},
			},
			required: ['teamId', 'members'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: {
					type: 'string',
				},
				members: {
					type: 'array',
					items: {
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
					minItems: 1,
					uniqueItems: true,
				},
			},
			required: ['teamName', 'members'],
			additionalProperties: false,
		},
	],
};

export const isTeamsAddMembersProps = ajv.compile<TeamsAddMembersProps>(teamsAddMembersPropsSchema);
