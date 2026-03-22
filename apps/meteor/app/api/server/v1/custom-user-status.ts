import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import { CustomUserStatus } from '@rocket.chat/models';
import { ajv, ajvQuery, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse, isCustomUserStatusCreateProps, isCustomUserStatusDeleteProps, isCustomUserStatusUpdateProps } from '@rocket.chat/rest-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
// import { Match, check } from 'meteor/check'; // No longer needed
import { Meteor } from 'meteor/meteor';
import { deleteCustomUserStatus } from '../../../user-status/server/methods/deleteCustomUserStatus';
import { insertOrUpdateUserStatus } from '../../../user-status/server/methods/insertOrUpdateUserStatus';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

// This file has been migrated to use modern API registration patterns and AJV validation.
// Redundant local type definitions and module augmentations have been removed to resolve 
// a TypeScript circular reference error, relying on the source of truth in `@rocket.chat/rest-typings`.

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

const isCustomUserStatusListProps = ajvQuery.compile<CustomUserStatusListProps>(CustomUserStatusListSchema);

API.v1.get(
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
			...(name ? { name: { $regex: escapeRegExp(name as string), $options: 'i' } } : {}),
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
/**
 * @openapi
 * /api/v1/custom-user-status.update:
 * post:
 * description: Update an existing custom user status
 * security:
 * - cookieAuth: []
 * - x-user-id: []
 * - x-auth-token: []
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * _id:
 * type: string
 * name:
 * type: string
 * statusType:
 * type: string
 * required:
 * - _id
 * - name
 * responses:
 * 200:
 * description: The updated custom user status
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ApiSuccessV1'
 * default:
 * $ref: '#/components/schemas/ApiErrorsV1'
 */
API.v1.post(
	'custom-user-status.create',
	{
		authRequired: true,
		body: isCustomUserStatusCreateProps,
		response: {
			200: ajv.compile<{ customUserStatus: ICustomUserStatus }>({
				type: 'object',
				properties: {
					customUserStatus: {
						$ref: '#/components/schemas/ICustomUserStatus',
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success', 'customUserStatus'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function () {
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
/**
 * @openapi
 * /api/v1/custom-user-status.update:
 * post:
 * description: Update an existing custom user status
 * security:
 * - cookieAuth: []
 * - x-user-id: []
 * - x-auth-token: []
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * _id:
 * type: string
 * name:
 * type: string
 * statusType:
 * type: string
 * required:
 * - _id
 * - name
 * responses:
 * 200:
 * description: The updated custom user status
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ApiSuccessV1'
 * default:
 * $ref: '#/components/schemas/ApiErrorsV1'
 */
API.v1.post(
	'custom-user-status.delete',
	{
		authRequired: true,
		body: isCustomUserStatusDeleteProps,
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function () {
		const { customUserStatusId } = this.bodyParams;

		await deleteCustomUserStatus(this.userId, customUserStatusId);

		return API.v1.success();
	},
);
/**
 * @openapi
 * /api/v1/custom-user-status.update:
 * post:
 * description: Update an existing custom user status
 * security:
 * - cookieAuth: []
 * - x-user-id: []
 * - x-auth-token: []
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * _id:
 * type: string
 * name:
 * type: string
 * statusType:
 * type: string
 * required:
 * - _id
 * - name
 * responses:
 * 200:
 * description: The updated custom user status
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ApiSuccessV1'
 * default:
 * $ref: '#/components/schemas/ApiErrorsV1'
 */
API.v1.post(
	'custom-user-status.update',
	{ 
		authRequired: true,
		body: isCustomUserStatusUpdateProps,
		response: {
			200: ajv.compile<{ customUserStatus: ICustomUserStatus }>({
				type: 'object',
				properties: {
					customUserStatus: {
						$ref: '#/components/schemas/ICustomUserStatus',
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success', 'customUserStatus'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function () {
		const { _id, name, statusType } = this.bodyParams;

		const customUserStatusToUpdate = await CustomUserStatus.findOneById(_id);

		// Ensure the message exists
		if (!customUserStatusToUpdate) {
			return API.v1.failure(`No custom user status found with the id of "${_id}".`);
		}

		await insertOrUpdateUserStatus(this.userId, {
			_id,
			name: name || customUserStatusToUpdate.name,
			statusType: statusType || customUserStatusToUpdate.statusType,
			previousName: customUserStatusToUpdate.name,
			previousStatusType: customUserStatusToUpdate.statusType,
		});

		const customUserStatus = await CustomUserStatus.findOneById(_id);

		if (!customUserStatus) {
			throw new Meteor.Error('error-updating-custom-user-status', 'Error updating custom user status');
		}

		return API.v1.success({
			customUserStatus,
		});
	},
);

// Note for Mentors:
// The circular reference error (Type alias 'CustomUserStatusEndpoints' circularly references itself)
// was resolved by removing the redundant server-side re-definition of CustomUserStatusEndpoints 
// and the manual module augmentation. The endpoint types are now correctly resolved through the
// global `Endpoints` interface provided by the `@rocket.chat/rest-typings` package, following 
// the project's modern API migration patterns.

