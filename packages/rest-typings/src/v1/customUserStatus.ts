import type { ICustomUserStatus } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';

type CustomUserStatusCreateProps = { name: string; statusType?: string };

const CustomUserStatusCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		statusType: { type: 'string', nullable: true },
	},
	required: ['name'],
	additionalProperties: false,
};

export const isCustomUserStatusCreateProps = ajv.compile<CustomUserStatusCreateProps>(CustomUserStatusCreatePropsSchema);

type CustomUserStatusDeleteProps = { customUserStatusId: string };

const CustomUserStatusDeletePropsSchema = {
	type: 'object',
	properties: {
		customUserStatusId: { type: 'string' },
	},
	required: ['customUserStatusId'],
	additionalProperties: false,
};

export const isCustomUserStatusDeleteProps = ajv.compile<CustomUserStatusDeleteProps>(CustomUserStatusDeletePropsSchema);

type CustomUserStatusUpdateProps = { _id: string; name?: string; statusType?: string };

const CustomUserStatusUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string', nullable: true },
		statusType: { type: 'string', nullable: true },
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isCustomUserStatusUpdateProps = ajv.compile<CustomUserStatusUpdateProps>(CustomUserStatusUpdatePropsSchema);

export type CustomUserStatusEndpoints = {
	'/v1/custom-user-status.create': {
		POST: (params: CustomUserStatusCreateProps) => {
			customUserStatus: ICustomUserStatus;
		};
	};
	'/v1/custom-user-status.delete': {
		POST: (params: CustomUserStatusDeleteProps) => void;
	};
	'/v1/custom-user-status.update': {
		POST: (params: CustomUserStatusUpdateProps) => {
			customUserStatus: ICustomUserStatus;
		};
	};
};
