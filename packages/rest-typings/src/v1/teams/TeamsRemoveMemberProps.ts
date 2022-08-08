import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsRemoveMemberProps = ({ teamId: string } | { teamName: string }) & {
	userId: string;
	rooms?: Array<string>;
};

const teamsRemoveMemberPropsSchema: JSONSchemaType<TeamsRemoveMemberProps> = {
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

export const isTeamsRemoveMemberProps = ajv.compile(teamsRemoveMemberPropsSchema);
