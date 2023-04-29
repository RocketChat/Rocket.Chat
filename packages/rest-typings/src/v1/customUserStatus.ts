import type { ICustomUserStatus, IUserStatus } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';
import { ajv } from '../helpers/schemas';

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

export type CustomUserStatusEndpoints = {
	'/v1/custom-user-status.list': {
		GET: (params: CustomUserStatusListProps) => PaginatedResult<{
			statuses: IUserStatus[];
		}>;
	};
	'/v1/custom-user-status.create': {
		POST: (params: { name: string; statusType?: string }) => {
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
