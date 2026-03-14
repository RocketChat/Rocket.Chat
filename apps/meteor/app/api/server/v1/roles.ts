import { api, Authorization } from '@rocket.chat/core-services';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';
import {
	ajv,
	isRoleAddUserToRoleProps,
	isRoleDeleteProps,
	isRoleRemoveUserFromRoleProps,
	isRolesGetUsersInRoleProps,
	isRoleSyncProps,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { getUsersInRolePaginated } from '../../../authorization/server/functions/getUsersInRole';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync, hasAnyRoleAsync } from '../../../authorization/server/functions/hasRole';
import { addUserToRole } from '../../../authorization/server/methods/addUserToRole';
import { notifyOnRoleChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server/index';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';

const rolesEndpoints = API.v1
	.get(
		'roles.list',
		{
			authRequired: true,
			response: {
				200: ajv.compile<{ roles: IRole[]; success: true }>({
					type: 'object',
					properties: {
						roles: { type: 'array', items: { type: 'object', additionalProperties: true } },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['roles', 'success'],
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const roles = await Roles.find({}, { projection: { _updatedAt: 0 } }).toArray();

			return API.v1.success({ roles });
		},
	)
	.get(
		'roles.sync',
		{
			authRequired: true,
			query: isRoleSyncProps,
			response: {
				200: ajv.compile<{ roles: { update: IRole[]; remove: IRole[] }; success: true }>({
					type: 'object',
					properties: {
						roles: {
							type: 'object',
							properties: {
								update: { type: 'array', items: { type: 'object', additionalProperties: true } },
								remove: { type: 'array', items: { type: 'object', additionalProperties: true } },
							},
							required: ['update', 'remove'],
							additionalProperties: false,
						},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['roles', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { updatedSince } = this.queryParams;

			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			}

			return API.v1.success({
				roles: {
					update: await Roles.findByUpdatedDate(new Date(updatedSince)).toArray(),
					remove: await Roles.trashFindDeletedAfter(new Date(updatedSince)).toArray(),
				},
			});
		},
	)
	.post(
		'roles.addUserToRole',
		{
			authRequired: true,
			body: isRoleAddUserToRoleProps,
			response: {
				200: ajv.compile<{ role: IRole; success: true }>({
					type: 'object',
					properties: {
						role: { type: 'object', additionalProperties: true },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['role', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const user = await getUserFromParams(this.bodyParams);
			const { roleId, roomId } = this.bodyParams;

			if (!roleId) {
				return API.v1.failure('error-invalid-role-properties');
			}

			const role = await Roles.findOneById(roleId);
			if (!role) {
				return API.v1.failure('error-role-not-found', 'Role not found');
			}

			if (await hasRoleAsync(user._id, role._id, roomId)) {
				throw new Meteor.Error('error-user-already-in-role', 'User already in role');
			}

			await addUserToRole(this.userId, role._id, user.username, roomId);

			return API.v1.success({
				role,
			});
		},
	)
	.get(
		'roles.getUsersInRole',
		{
			authRequired: true,
			permissionsRequired: ['access-permissions'],
			query: isRolesGetUsersInRoleProps,
			response: {
				200: ajv.compile<{ users: object[]; total: number; success: true }>({
					type: 'object',
					properties: {
						users: { type: 'array', items: { type: 'object', additionalProperties: true } },
						total: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['users', 'total', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { roomId, role } = this.queryParams;
			const { offset, count = 50 } = await getPaginationItems(this.queryParams);

			const projection = {
				name: 1,
				username: 1,
				emails: 1,
				avatarETag: 1,
				createdAt: 1,
				_updatedAt: 1,
			};

			if (roomId && !(await hasPermissionAsync(this.userId, 'view-other-user-channels'))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const options = { projection: { _id: 1 } };
			const roleData = await Roles.findOneById<Pick<IRole, '_id'>>(role, options);

			if (!roleData) {
				throw new Meteor.Error('error-invalid-roleId');
			}

			const { cursor, totalCount } = await getUsersInRolePaginated(roleData._id, roomId, {
				limit: count as number,
				sort: { username: 1 },
				skip: offset as number,
				projection,
			});

			const [users, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({ users, total });
		},
	)
	.post(
		'roles.delete',
		{
			authRequired: true,
			permissionsRequired: ['access-permissions'],
			body: isRoleDeleteProps,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { bodyParams } = this;

			const role = await Roles.findOneByIdOrName(bodyParams.roleId);

			if (!role) {
				throw new Meteor.Error('error-invalid-roleId', 'This role does not exist');
			}

			if (role.protected) {
				throw new Meteor.Error('error-role-protected', 'Cannot delete a protected role');
			}

			if ((await Roles.countUsersInRole(role._id)) > 0) {
				throw new Meteor.Error('error-role-in-use', "Cannot delete role because it's in use");
			}

			await Roles.removeById(role._id);

			void notifyOnRoleChanged(role, 'removed');

			return API.v1.success();
		},
	)
	.post(
		'roles.removeUserFromRole',
		{
			authRequired: true,
			permissionsRequired: ['access-permissions'],
			body: isRoleRemoveUserFromRoleProps,
			response: {
				200: ajv.compile<{ role: IRole; success: true }>({
					type: 'object',
					properties: {
						role: { type: 'object', additionalProperties: true },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['role', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { bodyParams } = this;

			const { roleId, username, scope } = bodyParams;

			if (!roleId) {
				return API.v1.failure('error-invalid-role-properties');
			}

			const user = await Users.findOneByUsername(username);

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'There is no user with this username');
			}

			const role = await Roles.findOneById(roleId);

			if (!role) {
				throw new Meteor.Error('error-invalid-roleId', 'This role does not exist');
			}

			if (!(await hasAnyRoleAsync(user._id, [role._id], scope))) {
				throw new Meteor.Error('error-user-not-in-role', 'User is not in this role');
			}

			if (role._id === 'admin') {
				const adminCount = await Roles.countUsersInRole('admin');
				if (adminCount === 1) {
					throw new Meteor.Error('error-admin-required', 'You need to have at least one admin');
				}
			}

			await removeUserFromRolesAsync(user._id, [role._id], scope);

			if (settings.get('UI_DisplayRoles')) {
				void api.broadcast('user.roleUpdate', {
					type: 'removed',
					_id: role._id,
					u: {
						_id: user._id,
						username: user.username,
					},
					scope,
				});
			}

			return API.v1.success({
				role,
			});
		},
	)
	.get(
		'roles.getUsersInPublicRoles',
		{
			authRequired: true,
			response: {
				200: ajv.compile<{
					users: {
						_id: string;
						username: string;
						roles: string[];
					}[];
				}>({
					type: 'object',
					properties: {
						users: {
							type: 'array',
							items: {
								type: 'object',
								properties: { _id: { type: 'string' }, username: { type: 'string' }, roles: { type: 'array', items: { type: 'string' } } },
							},
						},
					},
				}),
			},
		},

		async () => {
			return API.v1.success({
				users: await Authorization.getUsersFromPublicRoles(),
			});
		},
	);

type RolesEndpoints = ExtractRoutesFromAPI<typeof rolesEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends RolesEndpoints {}
}
