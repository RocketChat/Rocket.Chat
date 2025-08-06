import { ajv } from '../Ajv';

export type TeamsRemoveMemberProps = ({ teamId: string } | { teamName: string }) & {
	userId: string;
	rooms?: Array<string>;
};

const teamsRemoveMemberPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				userId: {
					type: 'string',
				},
				rooms: {
					type: 'array',
					items: {
						type: 'string',
					},
					minItems: 1,
					uniqueItems: true,
					nullable: true,
				},
			},
			required: ['teamId', 'userId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: {
					type: 'string',
				},
				userId: {
					type: 'string',
				},
				rooms: {
					type: 'array',
					items: {
						type: 'string',
					},
					minItems: 1,
					uniqueItems: true,
					nullable: true,
				},
			},
			required: ['teamName', 'userId'],
			additionalProperties: false,
		},
	],
};

export const isTeamsRemoveMemberProps = ajv.compile<TeamsRemoveMemberProps>(teamsRemoveMemberPropsSchema);
