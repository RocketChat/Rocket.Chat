import type { IRole } from '@rocket.chat/core-typings';

import { createAuthorizationFunctions } from './createAuthorizationFunctions';
import { permissions } from '../../server/lib/authorization/constant/permissions';

const roleScopes: Record<IRole['_id'], IRole['scope']> = { user: 'Users', moderator: 'Subscriptions' };

const setup = (
	{ userRoles, roomRoles = {} }: { userRoles: IRole['_id'][]; roomRoles?: Record<string, IRole['_id'][]> },
	create = createAuthorizationFunctions,
) =>
	create({
		getCurrentUserId: () => 'uid',
		getUserRoles: () => userRoles,
		getPermission: (permissionId) => {
			const permission = permissions.find(({ _id }) => _id === permissionId);
			return permission && { ...permission, _updatedAt: new Date() };
		},
		getRoleScope: (roleId) => roleScopes[roleId],
		getSubscriptionRoles: (rid) => roomRoles[rid] ?? [],
		isReady: () => true,
	});

describe('createAuthorizationFunctions', () => {
	describe('hasPermission', () => {
		it('grants a room permission in every room to a user who holds a scoped role globally', () => {
			const { hasPermission } = setup({ userRoles: ['user', 'moderator'] });

			expect(hasPermission('delete-message', 'room-1')).toBe(true);
			expect(hasPermission('delete-message', 'room-2')).toBe(true);
		});

		it('grants a room-less permission to a user who holds a scoped role globally', () => {
			const { hasPermission } = setup({ userRoles: ['user', 'moderator'] });

			expect(hasPermission('create-invite-links')).toBe(true);
		});

		it('grants a permission from a scoped role on a subscription only in that room', () => {
			const { hasPermission } = setup({ userRoles: ['user'], roomRoles: { 'room-1': ['moderator'] } });

			expect(hasPermission('delete-message', 'room-1')).toBe(true);
			expect(hasPermission('delete-message', 'room-2')).toBe(false);
			expect(hasPermission('create-invite-links')).toBe(false);
		});

		it('grants a permission through a role the caller lends for a room that does not exist yet', () => {
			const { hasPermission } = setup({ userRoles: ['user'] });

			expect(hasPermission('set-readonly', undefined, ['owner'])).toBe(true);
		});

		it('applies the restrictions of a role held on a subscription in that room', () => {
			jest.isolateModules(() => {
				const { AuthorizationUtils } = jest.requireActual<typeof import('@rocket.chat/authorization/dist/AuthorizationUtils')>(
					'@rocket.chat/authorization/dist/AuthorizationUtils',
				);
				const isolated = jest.requireActual<typeof import('./createAuthorizationFunctions')>('./createAuthorizationFunctions');
				AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-c-room']);
				const { hasPermission } = setup({ userRoles: ['user'], roomRoles: { 'room-1': ['guest'] } }, isolated.createAuthorizationFunctions);

				expect(hasPermission('view-outside-room')).toBe(true);
				expect(hasPermission('view-outside-room', 'room-1')).toBe(false);
			});
		});
	});

	describe('userHasAllPermission', () => {
		it('does not use the room roles of the logged-in user to check another user', () => {
			const { userHasAllPermission } = setup({ userRoles: ['user'], roomRoles: { 'room-1': ['moderator'] } });

			expect(userHasAllPermission('delete-message', 'room-1', 'uid')).toBe(true);
			expect(userHasAllPermission('delete-message', 'room-1', 'another-uid')).toBe(false);
		});
	});

	describe('hasRole', () => {
		it('does not count a scoped role held globally as a role in the room', () => {
			const { hasRole } = setup({ userRoles: ['user', 'moderator'] });

			expect(hasRole('uid', 'moderator', 'room-1')).toBe(false);
		});
	});
});
