import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import { CustomUserStatus } from '@rocket.chat/models';
import { ajv, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { deleteCustomUserStatus } from '../../../user-status/server/methods/deleteCustomUserStatus';
import { insertOrUpdateUserStatus } from '../../../user-status/server/methods/insertOrUpdateUserStatus';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type CustomUserStatusListProps = PaginatedRequest<{ name?: string; _id?: string; query?: string }>;

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
		name: {
			type: 'string',
			nullable: true,
		},
		_id: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

const isCustomUserStatusListProps = ajv.compile<CustomUserStatusListProps>(CustomUserStatusListSchema);

const customUserStatusEndpoints = API.v1.get(
	'custom-user-status.list',
	{
		authRequired: true,
		query: isCustomUserStatusListProps,
		response: {
			200: ajv.compile<
				PaginatedResult<{
					statuses: ICustomUserStatus[];
				}>
			>({
				type: 'object',
				properties: {
					statuses: {
						type: 'array',
						items: {
							$ref: '#/components/schemas/ICustomUserStatus',
						},
					},
					count: {
						type: 'number',
						description: 'The number of custom user statuses returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of custom user statuses that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of custom user statuses that match the query.',
					},
					success: {
						type: 'boolean',
						enum: [true],
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success', 'statuses', 'count', 'offset', 'total'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort, query } = await this.parseJsonQuery();

		const { name, _id } = this.queryParams;

		const filter = {
			...query,
			...(name ? { name: { $regex: escapeRegExp(name), $options: 'i' } } : {}),
			...(_id ? { _id } : {}),
		};

		const { cursor, totalCount } = CustomUserStatus.findPaginated(filter, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		});

		const [statuses, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({
			statuses,
			count: statuses.length,
			offset,
			total,
		});
	},
);

const isCustomUserStatusCreateProps = ajv.compile<{ name: string; statusType?: string }>({
	type: 'object',
	properties: {
		name: { type: 'string' },
		statusType: { type: 'string', nullable: true },
	},
	required: ['name'],
	additionalProperties: false,
});

const customUserStatusCreateResponseSchema = ajv.compile<{ customUserStatus: ICustomUserStatus }>({
	type: 'object',
	properties: {
		customUserStatus: { $ref: '#/components/schemas/ICustomUserStatus' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['customUserStatus', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'custom-user-status.create',
	{
		authRequired: true,
		body: isCustomUserStatusCreateProps,
		response: {
			200: customUserStatusCreateResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const userStatusData = {
			name: this.bodyParams.name,
			statusType: this.bodyParams.statusType || '',
		};

		await insertOrUpdateUserStatus(this.userId, userStatusData);

		const customUserStatus = await CustomUserStatus.findOneByName(userStatusData.name);
		if (!customUserStatus) {
			throw new Meteor.Error('error-creating-custom-user-status', 'Error creating custom user status');
		}

		return API.v1.success({
			customUserStatus,
		});
	},
);

const customUserStatusDeleteResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'custom-user-status.delete',
	{
		authRequired: true,
		response: {
			200: customUserStatusDeleteResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { customUserStatusId } = this.bodyParams;
		if (!customUserStatusId) {
			return API.v1.failure('The "customUserStatusId" params is required!');
		}

		await deleteCustomUserStatus(this.userId, customUserStatusId);

		return API.v1.success();
	},
);

const isCustomUserStatusUpdateProps = ajv.compile<{ _id: string; name: string; statusType?: string }>({
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		statusType: { type: 'string', nullable: true },
	},
	required: ['_id', 'name'],
	additionalProperties: false,
});

const customUserStatusUpdateResponseSchema = ajv.compile<{ customUserStatus: ICustomUserStatus }>({
	type: 'object',
	properties: {
		customUserStatus: { $ref: '#/components/schemas/ICustomUserStatus' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['customUserStatus', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'custom-user-status.update',
	{
		authRequired: true,
		body: isCustomUserStatusUpdateProps,
		response: {
			200: customUserStatusUpdateResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const userStatusData = {
			_id: this.bodyParams._id,
			name: this.bodyParams.name,
			statusType: this.bodyParams.statusType || '',
		};

		const customUserStatusToUpdate = await CustomUserStatus.findOneById(userStatusData._id);

		// Ensure the message exists
		if (!customUserStatusToUpdate) {
			return API.v1.failure(`No custom user status found with the id of "${userStatusData._id}".`);
		}

		await insertOrUpdateUserStatus(this.userId, userStatusData);

		const customUserStatus = await CustomUserStatus.findOneById(userStatusData._id);

		if (!customUserStatus) {
			throw new Meteor.Error('error-updating-custom-user-status', 'Error updating custom user status');
		}

		return API.v1.success({
			customUserStatus,
		});
	},
);

export type CustomUserStatusEndpoints = ExtractRoutesFromAPI<typeof customUserStatusEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CustomUserStatusEndpoints {}
}
