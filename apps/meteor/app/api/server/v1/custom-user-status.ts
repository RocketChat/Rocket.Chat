import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import { CustomUserStatus } from '@rocket.chat/models';
import { ajv, ajvQuery, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { deleteCustomUserStatus } from '../../../user-status/server/methods/deleteCustomUserStatus';
import { insertOrUpdateUserStatus } from '../../../user-status/server/methods/insertOrUpdateUserStatus';
import type { ExtractRoutesFromAPI } from '../ApiClass';
// RULE 7: Colocate all endpoint typings and AJV validators within the handler file.
// This removes the dependency on manual definitions in the separate rest-typings package.
import { API } from '../../../../api/server';
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

const isCustomUserStatusListProps = ajvQuery.compile<CustomUserStatusListProps>(CustomUserStatusListSchema);

type CustomUserStatusCreateProps = { name: string; statusType?: string };

const CustomUserStatusCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		statusType: {
			type: 'string',
		},
	},
	required: ['name'],
	additionalProperties: false,
};

const isCustomUserStatusCreateProps = ajv.compile<CustomUserStatusCreateProps>(CustomUserStatusCreatePropsSchema);

type CustomUserStatusDeleteProps = { customUserStatusId: string };

const CustomUserStatusDeletePropsSchema = {
	type: 'object',
	properties: {
		customUserStatusId: {
			type: 'string',
		},
	},
	required: ['customUserStatusId'],
	additionalProperties: false,
};

const isCustomUserStatusDeleteProps = ajv.compile<CustomUserStatusDeleteProps>(CustomUserStatusDeletePropsSchema);

type CustomUserStatusUpdateProps = { _id: string; name?: string; statusType?: string };

const CustomUserStatusUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		name: {
			type: 'string',
			nullable: true,
		},
		statusType: {
			type: 'string',
			nullable: true,
		},
	},
	// Only _id is strictly required for updates; other fields are optional.
	required: ['_id'],
	additionalProperties: false,
};

const isCustomUserStatusUpdateProps = ajv.compile<CustomUserStatusUpdateProps>(CustomUserStatusUpdatePropsSchema);

/**
 * @openapi
 * /api/v1/custom-user-status.list:
 *  get:
 *    description: List custom user statuses
 *    security:
 *      - cookieAuth: []
 *      - x-user-id: []
 *      - x-auth-token: []
 *    parameters:
 *      - in: query
 *        name: name
 *        schema:
 *          type: string
 *        description: The name of the custom user status
 *      - in: query
 *        name: _id
 *        schema:
 *          type: string
 *        description: The ID of the custom user status
 *      - in: query
 *        name: query
 *        schema:
 *          type: string
 *        description: The query to filter custom user statuses
 *      - in: query
 *        name: count
 *        schema:
 *          type: number
 *        description: The number of items to return
 *      - in: query
 *        name: offset
 *        schema:
 *          type: number
 *        description: The number of items to skip
 *      - in: query
 *        name: sort
 *        schema:
 *          type: string
 *        description: The sort order
 *    responses:
 *      200:
 *        description: List of custom user statuses
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statuses:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/ICustomUserStatus'
 *                count:
 *                  type: number
 *                offset:
 *                  type: number
 *                total:
 *                  type: number
 *                success:
 *                  type: boolean
 *      default:
 *        $ref: '#/components/schemas/ApiErrorsV1'
 */
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
 * /api/v1/custom-user-status.create:
 *  post:
 *    description: Create a new custom user status
 *    security:
 *      - cookieAuth: []
 *      - x-user-id: []
 *      - x-auth-token: []
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              statusType:
 *                type: string
 *            required:
 *              - name
 *    responses:
 *      200:
 *        description: The created custom user status
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                customUserStatus:
 *                  $ref: '#/components/schemas/ICustomUserStatus'
 *                success:
 *                  type: boolean
 *      default:
 *        $ref: '#/components/schemas/ApiErrorsV1'
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
					},
				},
				required: ['success', 'customUserStatus'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { name, statusType } = this.bodyParams;

		const userStatusData = {
			name: name || '',
			statusType: statusType || '',
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
 * /api/v1/custom-user-status.delete:
 *  post:
 *    description: Delete an existing custom user status
 *    security:
 *      - cookieAuth: []
 *      - x-user-id: []
 *      - x-auth-token: []
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              customUserStatusId:
 *                type: string
 *            required:
 *              - customUserStatusId
 *    responses:
 *      200:
 *        description: Success status
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *      default:
 *        $ref: '#/components/schemas/ApiErrorsV1'
 */
API.v1.post(
	'custom-user-status.delete',
	{
		authRequired: true,
		body: isCustomUserStatusDeleteProps,
		response: {
			200: ajv.compile<{ success: boolean }>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
					},
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { customUserStatusId } = this.bodyParams;

		await deleteCustomUserStatus(this.userId, customUserStatusId);

		// Return success: true as expected by the response schema.
		return API.v1.success({});
	},
);

/**
 * @openapi
 * /api/v1/custom-user-status.update:
 *  post:
 *    description: Update an existing custom user status
 *    security:
 *      - cookieAuth: []
 *      - x-user-id: []
 *      - x-auth-token: []
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              _id:
 *                type: string
 *              name:
 *                type: string
 *              statusType:
 *                type: string
 *            required:
 *              - _id
 *    responses:
 *      200:
 *        description: The updated custom user status
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                customUserStatus:
 *                  $ref: '#/components/schemas/ICustomUserStatus'
 *                success:
 *                  type: boolean
 *      default:
 *        $ref: '#/components/schemas/ApiErrorsV1'
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
					},
				},
				required: ['success', 'customUserStatus'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { _id, name, statusType } = this.bodyParams;

		const customUserStatusToUpdate = await CustomUserStatus.findOneById(_id);

		if (!customUserStatusToUpdate) {
			return API.v1.failure(`No custom user status found with the id of "${_id}".`);
		}

		const userStatusData = {
			_id,
			// Use nullish coalescing (??) to correctly handle explicit empty-string inputs
			// which would be ignored by a logical OR (||) check.
			name: name ?? customUserStatusToUpdate.name,
			statusType: statusType ?? customUserStatusToUpdate.statusType,
		};

		await insertOrUpdateUserStatus(this.userId, userStatusData);

		const customUserStatus = await CustomUserStatus.findOneById(_id);

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
	interface Endpoints extends CustomUserStatusEndpoints { }
}
