import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from './Ajv';

// This file defines the API contract and AJV validation schemas for Custom User Status endpoints.
// It serves as the single source of truth for both the client (types) and the server (validation).

export type CustomUserStatusCreateProps = {
	name: string;
	statusType?: string;
};

export type CustomUserStatusDeleteProps = {
	customUserStatusId: string;
};

export type CustomUserStatusUpdateProps = {
	_id: string;
	name?: string;
	statusType?: string;
};

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

const customUserStatusCreatePropsSchema: JSONSchemaType<CustomUserStatusCreateProps> = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		statusType: { type: 'string', nullable: true },
	},
	required: ['name'],
	additionalProperties: false,
};

export const isCustomUserStatusCreateProps = ajv.compile<CustomUserStatusCreateProps>(customUserStatusCreatePropsSchema);

const customUserStatusDeletePropsSchema: JSONSchemaType<CustomUserStatusDeleteProps> = {
	type: 'object',
	properties: {
		customUserStatusId: { type: 'string' },
	},
	required: ['customUserStatusId'],
	additionalProperties: false,
};

export const isCustomUserStatusDeleteProps = ajv.compile<CustomUserStatusDeleteProps>(customUserStatusDeletePropsSchema);

const customUserStatusUpdatePropsSchema: JSONSchemaType<CustomUserStatusUpdateProps> = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string', nullable: true },
		statusType: { type: 'string', nullable: true },
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isCustomUserStatusUpdateProps = ajv.compile<CustomUserStatusUpdateProps>(customUserStatusUpdatePropsSchema);
