import { Users } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { hasAtLeastOnePermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { findAgents, findManagers } from '../../../server/api/lib/users';
import { addManager, addAgent, removeAgent, removeManager } from '../../../server/lib/omni-users';

// --- Local types and AJV schemas (moved from rest-typings) ---

type LivechatUsersManagerGETLocal = {
	text?: string;
	fields?: string;
	onlyAvailable?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	count?: number;
	offset?: number;
	sort?: string;
	query?: string;
};

const LivechatUsersManagerGETLocalSchema = {
	type: 'object',
	properties: {
		text: { type: 'string', nullable: true },
		onlyAvailable: { type: 'boolean', nullable: true },
		excludeId: { type: 'string', nullable: true },
		showIdleAgents: { type: 'boolean', nullable: true },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
		fields: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

const isLivechatUsersManagerGETLocal = ajv.compile<LivechatUsersManagerGETLocal>(LivechatUsersManagerGETLocalSchema);

type POSTLivechatUsersTypeLocal = {
	username: string;
};

const POSTLivechatUsersTypeLocalSchema = {
	type: 'object',
	properties: {
		username: { type: 'string' },
	},
	required: ['username'],
	additionalProperties: false,
};

const isPOSTLivechatUsersTypeLocal = ajv.compile<POSTLivechatUsersTypeLocal>(POSTLivechatUsersTypeLocalSchema);

// --- Response schemas ---

const paginatedUsersResponseSchema = ajv.compile<{
	users: object[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		// ILivechatAgent is not registered in typia (extends IUser with livechat-specific fields),
		// so we use { type: 'object' } as a fallback.
		users: { type: 'array', items: { type: 'object' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['users', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const postUserResponseSchema = ajv.compile<{ user: object }>({
	type: 'object',
	properties: {
		user: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['user', 'success'],
	additionalProperties: false,
});

const successOnlyResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const getUserByIdResponseSchema = ajv.compile<{ user: object | null }>({
	type: 'object',
	properties: {
		user: { type: ['object', 'null'] },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['user', 'success'],
	additionalProperties: false,
});

const emptyStringArray: string[] = [];

API.v1
	.get(
		'livechat/users/:type',
		{
			authRequired: true,
			permissionsRequired: emptyStringArray,
			query: isLivechatUsersManagerGETLocal,
			response: {
				200: paginatedUsersResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text } = this.queryParams;

			if (this.urlParams.type === 'agent') {
				if (!(await hasAtLeastOnePermissionAsync(this.userId, ['transfer-livechat-guest', 'edit-omnichannel-contact']))) {
					return API.v1.forbidden('error-not-authorized');
				}

				const { onlyAvailable = false, excludeId, showIdleAgents } = this.queryParams;
				return API.v1.success(
					await findAgents({
						text,
						onlyAvailable,
						excludeId,
						showIdleAgents,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				);
			}
			if (this.urlParams.type === 'manager') {
				if (!(await hasAtLeastOnePermissionAsync(this.userId, ['view-livechat-manager']))) {
					return API.v1.forbidden('error-not-authorized');
				}

				return API.v1.success(
					await findManagers({
						text,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				);
			}
			throw new Error('Invalid type');
		},
	)
	.post(
		'livechat/users/:type',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			body: isPOSTLivechatUsersTypeLocal,
			response: {
				200: postUserResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			if (this.urlParams.type === 'agent') {
				const user = await addAgent(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else if (this.urlParams.type === 'manager') {
				const user = await addManager(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		},
	)
	.get(
		'livechat/users/:type/:_id',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			query: undefined,
			response: {
				200: getUserByIdResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			if (!['agent', 'manager'].includes(this.urlParams.type)) {
				throw new Error('Invalid type');
			}
			const role = this.urlParams.type === 'agent' ? 'livechat-agent' : 'livechat-manager';

			const user = await Users.findOneByIdAndRole(this.urlParams._id, role, {
				projection: { _id: 1, username: 1, name: 1, status: 1, statusLivechat: 1, emails: 1, livechat: 1 },
			});

			// TODO: throw error instead of returning null
			return API.v1.success({ user });
		},
	)
	.delete(
		'livechat/users/:type/:_id',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			query: undefined,
			response: {
				200: successOnlyResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			if (this.urlParams.type === 'agent') {
				if (await removeAgent(this.urlParams._id)) {
					return API.v1.success();
				}
			} else if (this.urlParams.type === 'manager') {
				if (await removeManager(this.urlParams._id)) {
					return API.v1.success();
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure('error-removing-user');
		},
	);

