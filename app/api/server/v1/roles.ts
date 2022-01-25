import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { Users } from '../../../models/server';
import { API } from '../api';
import { getUsersInRole, hasRole } from '../../../authorization/server';
import { settings } from '../../../settings/server/index';
import { api } from '../../../../server/sdk/api';
import { Roles } from '../../../models/server/raw';
import { hasAnyRoleAsync } from '../../../authorization/server/functions/hasRole';
import {
	isRoleAddUserToRoleProps,
	isRoleCreateProps,
	isRoleDeleteProps,
	isRoleRemoveUserFromRoleProps,
	isRoleUpdateProps,
} from '../../../../definition/rest/v1/roles';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { updateRole } from '../../../../server/lib/roles/updateRole';
import { insertRole } from '../../../../server/lib/roles/insertRole';

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
	'roles.create',
	{ authRequired: true },
	{
		async post() {
			if (!isRoleCreateProps(this.bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			if (!(await hasPermissionAsync(Meteor.userId(), 'access-permissions'))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed');
			}

			const { name, scope, description, mandatory2fa } = this.bodyParams;

			if (await Roles.findOneByIdOrName(name)) {
				throw new Meteor.Error('error-duplicate-role-names-not-allowed', 'Role name already exists');
			}

			const roleData = {
				description: description || '',
				...(mandatory2fa !== undefined && { mandatory2fa }),
				name,
				scope: scope || 'Users',
				protected: false,
			};

			const options = {
				broadcastUpdate: settings.get<boolean>('UI_DisplayRoles'),
			};

			const role = insertRole(roleData, options);

			return API.v1.success({
				role,
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

			// Precisa mudar todos os endpoints pra aceitarem roleId também. Se receber o parâmetro como roleName, dar um deprecation warning
			const user = this.getUserFromParams();
			const { roleName, roomId } = this.bodyParams;

			if (hasRole(user._id, roleId, roomId)) {
				throw new Meteor.Error('error-user-already-in-role', 'User already in role');
			}

			const role = await Roles.findOneByIdOrName(roleName);

			if (!role) {
				return API.v1.failure('error-role-not-found', 'Role not found');
			}

			await Meteor.call('authorization:addUserToRole', roleName, user.username, roomId);

			return API.v1.success({
				role,
			});
		},
	},
);

API.v1.addRoute(
	'roles.getUsersInRole',
	{ authRequired: true },
	{
		async get() {
			const { roomId, role } = this.queryParams;
			const { offset, count = 50 } = this.getPaginationItems();

			const projection = {
				name: 1,
				username: 1,
				emails: 1,
				avatarETag: 1,
			};

			if (!role) {
				throw new Meteor.Error('error-param-not-provided', 'Query param "role" is required');
			}
			if (!(await hasPermissionAsync(this.userId, 'access-permissions'))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}
			if (roomId && !(await hasPermissionAsync(this.userId, 'view-other-user-channels'))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}
			const users = await getUsersInRole(role, roomId, {
				limit: count as number,
				sort: { username: 1 },
				skip: offset as number,
				projection,
			});

			return API.v1.success({ users: await users.toArray(), total: await users.count() });
		},
	},
);

API.v1.addRoute(
	'roles.update',
	{ authRequired: true },
	{
		async post() {
			if (!isRoleUpdateProps(this.bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			if (!(await hasPermissionAsync(Meteor.userId(), 'access-permissions'))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed');
			}

			const { roleId, name, scope, description, mandatory2fa } = this.bodyParams;

			const roleData = {
				description: description || '',
				...(mandatory2fa !== undefined && { mandatory2fa }),
				name,
				scope: scope || 'Users',
				protected: false,
			};

			const options = {
				broadcastUpdate: settings.get<boolean>('UI_DisplayRoles'),
			};

			const role = updateRole(roleId, roleData, options);

			return API.v1.success({
				role,
			});
		},
	},
);

API.v1.addRoute(
	'roles.delete',
	{ authRequired: true },
	{
		async post() {
			const { bodyParams } = this;
			if (!isRoleDeleteProps(bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			if (!(await hasPermissionAsync(this.userId, 'access-permissions'))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed');
			}

			const role = await Roles.findOneByIdOrName(bodyParams.roleId);

			if (!role) {
				throw new Meteor.Error('error-invalid-roleId', 'This role does not exist');
			}

			if (role.protected) {
				throw new Meteor.Error('error-role-protected', 'Cannot delete a protected role');
			}

			const existingUsers = await Roles.findUsersInRole(role.name);

			if (existingUsers && (await existingUsers.count()) > 0) {
				throw new Meteor.Error('error-role-in-use', "Cannot delete role because it's in use");
			}

			await Roles.removeById(role._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'roles.removeUserFromRole',
	{ authRequired: true },
	{
		async post() {
			const { bodyParams } = this;
			if (!isRoleRemoveUserFromRoleProps(bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			const { roleName, username, scope } = bodyParams;

			if (!(await hasPermissionAsync(this.userId, 'access-permissions'))) {
				throw new Meteor.Error('error-not-allowed', 'Accessing permissions is not allowed');
			}

			const user = Users.findOneByUsername(username);

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'There is no user with this username');
			}

			const role = await Roles.findOneByIdOrName(roleName);

			if (!role) {
				throw new Meteor.Error('error-invalid-roleId', 'This role does not exist');
			}

			if (!(await hasAnyRoleAsync(user._id, [role.name], scope))) {
				throw new Meteor.Error('error-user-not-in-role', 'User is not in this role');
			}

			if (role._id === 'admin') {
				const adminCount = await (await Roles.findUsersInRole('admin')).count();
				if (adminCount === 1) {
					throw new Meteor.Error('error-admin-required', 'You need to have at least one admin');
				}
			}

			await Roles.removeUserRoles(user._id, [role.name], scope);

			if (settings.get('UI_DisplayRoles')) {
				api.broadcast('user.roleUpdate', {
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
