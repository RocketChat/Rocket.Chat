import type { ICustomUserStatus, IUserStatus } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type CustomUserStatusListProps = PaginatedRequest<{ query: string }>;

const CustomUserStatusListSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isCustomUserStatusListProps = ajv.compile<CustomUserStatusListProps>(CustomUserStatusListSchema);

type CustomUserStatusCreateProps = { name: string; statusType?: UserStatus };

const CustomUserStatusCreateSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		statusType: {
			type: 'string',
			enum: Object.values(UserStatus),
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isCustomUserStatusCreateProps = ajv.compile<CustomUserStatusCreateProps>(CustomUserStatusCreateSchema);

type CustomUserStatusUpdateProps = { _id: string; name: string; statusType?: UserStatus };

const CustomUserStatusUpdateSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		statusType: {
			type: 'string',
			enum: Object.values(UserStatus),
		},
	},
	required: ['_id', 'name'],
	additionalProperties: false,
};

export const isCustomUserStatusUpdateProps = ajv.compile<CustomUserStatusUpdateProps>(CustomUserStatusUpdateSchema);

export type CustomUserStatusEndpoints = {
	'/v1/custom-user-status.list': {
		GET: (params: CustomUserStatusListProps) => PaginatedResult<{
			statuses: IUserStatus[];
		}>;
	};
	'/v1/custom-user-status.create': {
		POST: (params: CustomUserStatusCreateProps) => {
			customUserStatus: ICustomUserStatus;
		};
	};
	'/v1/custom-user-status.delete': {
		POST: (params: { customUserStatusId: string }) => void;
	};
	'/v1/custom-user-status.update': {
		POST: (params: { id: string; name?: string; statusType?: string }) => {
			customUserStatus: ICustomUserStatus;
		};
	};
};
