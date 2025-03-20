import { api } from '@rocket.chat/core-services';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';
import { isRoleAddUserToRoleProps, isRoleDeleteProps, isRoleRemoveUserFromRoleProps } from '@rocket.chat/rest-typings';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { getUsersInRolePaginated } from '../../../authorization/server/functions/getUsersInRole';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync, hasAnyRoleAsync } from '../../../authorization/server/functions/hasRole';
import { addUserToRole } from '../../../authorization/server/methods/addUserToRole';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { notifyOnRoleChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server/index';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';

API.v1.addRoute(
	'roles.list',
	{ authRequired: true },
	{
		async get() {
			const roles = await Roles.find({}, { projection: { _updatedAt: 0 } }).toArray();

			return API.v1.success({ roles });
		},
	},
);

API.v1.addRoute(
	'roles.sync',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					updatedSince: Match.Where((value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))),
				}),
			);

			const { updatedSince } = this.queryParams;

			return API.v1.success({
				roles: {
					update: await Roles.findByUpdatedDate(new Date(updatedSince)).toArray(),
					remove: await Roles.trashFindDeletedAfter(new Date(updatedSince)).toArray(),
				},
			});
		},
	},
);

API.v1.addRoute(
	'roles.addUserToRole',
	{ authRequired: true },
	{
		async post() {
			if (!isRoleAddUserToRoleProps(this.bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', isRoleAddUserToRoleProps.errors?.map((error) => error.message).join('\n'));
			}

			const user = await getUserFromParams(this.bodyParams);
			const { roleId, roleName, roomId } = this.bodyParams;

			if (!roleId) {
				if (!roleName) {
					return API.v1.failure('error-invalid-role-properties');
				}

				apiDeprecationLogger.parameter(this.request.route, 'roleName', '7.0.0', this.response);
			}

			const role = roleId ? await Roles.findOneById(roleId) : await Roles.findOneByIdOrName(roleName as string);
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
	},
);

API.v1.addRoute(
	'roles.getUsersInRole',
	{ authRequired: true, permissionsRequired: ['access-permissions'] },
	{
		async get() {
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

			if (!role) {
				throw new Meteor.Error('error-param-not-provided', 'Query param "role" is required');
			}
			if (roomId && !(await hasPermissionAsync(this.userId, 'view-other-user-channels'))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const options = { projection: { _id: 1 } };
			let roleData = await Roles.findOneById<Pick<IRole, '_id'>>(role, options);
			if (!roleData) {
				roleData = await Roles.findOneByName<Pick<IRole, '_id'>>(role, options);
				if (!roleData) {
					throw new Meteor.Error('error-invalid-roleId');
				}

				apiDeprecationLogger.deprecatedParameterUsage(
					this.request.route,
					'role',
					'7.0.0',
					this.response,
					({ parameter, endpoint, version }) =>
						`Querying \`${parameter}\` by name is deprecated in ${endpoint} and will be removed on the removed on version ${version}`,
				);
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
	},
);

API.v1.addRoute(
	'roles.delete',
	{ authRequired: true, permissionsRequired: ['access-permissions'] },
	{
		async post() {
			const { bodyParams } = this;
			if (!isRoleDeleteProps(bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

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
	},
);

API.v1.addRoute(
	'roles.removeUserFromRole',
	{ authRequired: true, permissionsRequired: ['access-permissions'] },
	{
		async post() {
			const { bodyParams } = this;
			if (!isRoleRemoveUserFromRoleProps(bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			const { roleId, roleName, username, scope } = bodyParams;

			if (!roleId) {
				if (!roleName) {
					return API.v1.failure('error-invalid-role-properties');
				}

				apiDeprecationLogger.parameter(this.request.route, 'roleName', '7.0.0', this.response);
			}

			const user = await Users.findOneByUsername(username);

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'There is no user with this username');
			}

			const role = roleId ? await Roles.findOneById(roleId) : await Roles.findOneByIdOrName(roleName as string);

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
	},
);
