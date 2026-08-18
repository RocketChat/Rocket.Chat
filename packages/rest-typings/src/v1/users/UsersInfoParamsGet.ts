import { ajvQuery } from '../Ajv';

export type UsersInfoParamsGet = (
	| { userId: string }
	| { username: string }
	| { importId: string }
	| { email: string }
	| { freeSwitchExtension: string }
) & {
	fields?: string;
	includeUserRooms?: string;
};

const UsersInfoParamsGetSchema = {
	anyOf: [
		{
			type: 'object',
			description: 'Get information about a user by their id.',
			properties: {
				userId: {
					type: 'string',
					description: 'The user id.',
				},
				includeUserRooms: {
					type: 'string',
					description: 'Set to "true" to include the rooms the user belongs to in the response.',
				},
				fields: {
					type: 'string',
					nullable: true,
					description: 'JSON string describing which fields to include or exclude from the response.',
				},
			},
			required: ['userId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			description: 'Get information about a user by their username.',
			properties: {
				username: {
					type: 'string',
					description: 'The username.',
				},
				includeUserRooms: {
					type: 'string',
					description: 'Set to "true" to include the rooms the user belongs to in the response.',
				},
				fields: {
					type: 'string',
					nullable: true,
					description: 'JSON string describing which fields to include or exclude from the response.',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
		{
			type: 'object',
			description: 'Get information about a user by their import id.',
			properties: {
				importId: {
					type: 'string',
					description: 'The import id.',
				},
				includeUserRooms: {
					type: 'string',
					description: 'Set to "true" to include the rooms the user belongs to in the response.',
				},
				fields: {
					type: 'string',
					nullable: true,
					description: 'JSON string describing which fields to include or exclude from the response.',
				},
			},
			required: ['importId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			description: 'Get information about a user by their email address.',
			properties: {
				email: {
					type: 'string',
					description: 'The user email address.',
				},
				includeUserRooms: {
					type: 'string',
					description: 'Set to "true" to include the rooms the user belongs to in the response.',
				},
				fields: {
					type: 'string',
					nullable: true,
					description: 'JSON string describing which fields to include or exclude from the response.',
				},
			},
			required: ['email'],
			additionalProperties: false,
		},
		{
			type: 'object',
			description: 'Get information about a user by their FreeSwitch extension.',
			properties: {
				freeSwitchExtension: {
					type: 'string',
					description: 'The FreeSwitch extension.',
				},
				includeUserRooms: {
					type: 'string',
					description: 'Set to "true" to include the rooms the user belongs to in the response.',
				},
				fields: {
					type: 'string',
					nullable: true,
					description: 'JSON string describing which fields to include or exclude from the response.',
				},
			},
			required: ['freeSwitchExtension'],
			additionalProperties: false,
		},
	],
};

export const isUsersInfoParamsGetProps = ajvQuery.compile<UsersInfoParamsGet>(UsersInfoParamsGetSchema);
