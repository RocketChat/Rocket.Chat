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
			properties: {
				userId: {
					type: 'string',
				},
				includeUserRooms: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['userId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
				includeUserRooms: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				importId: {
					type: 'string',
				},
				includeUserRooms: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['importId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				email: {
					type: 'string',
				},
				includeUserRooms: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['email'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				freeSwitchExtension: {
					type: 'string',
				},
				includeUserRooms: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['freeSwitchExtension'],
			additionalProperties: false,
		},
	],
};

export const isUsersInfoParamsGetProps = ajvQuery.compile<UsersInfoParamsGet>(UsersInfoParamsGetSchema);
