import { AuthorizationUtils } from '@rocket.chat/authorization/dist/AuthorizationUtils';
import type { IPermission, IRole } from '@rocket.chat/core-typings';

import type { AuthorizationDeps } from './createAuthorizationFunctions';
import { createAuthorizationFunctions } from './createAuthorizationFunctions';

type World = {
	/** `null` means nobody is logged in. */
	currentUserId?: string | null;
	ready?: boolean;
	userRoles?: Record<string, string[] | undefined>;
	permissions?: Record<string, string[]>;
	roleScopes?: Record<string, IRole['scope']>;
	subscriptionRoles?: Record<string, string[]>;
};

const setup = ({
	currentUserId = 'current-user',
	ready = true,
	userRoles = {},
	permissions = {},
	roleScopes = {},
	subscriptionRoles = {},
}: World = {}) => {
	const deps: AuthorizationDeps = {
		getCurrentUserId: () => currentUserId ?? undefined,
		getUserRoles: (userId) => userRoles[userId],
		getPermission: (permissionId) =>
			permissionId in permissions ? ({ _id: permissionId, roles: permissions[permissionId] } as IPermission) : undefined,
		getRoleScope: (roleId) => roleScopes[roleId],
		hasSubscriptionRole: jest.fn((rid: string, roleId: string) => subscriptionRoles[rid]?.includes(roleId) ?? false),
		isReady: () => ready,
	};
	return { ...createAuthorizationFunctions(deps), deps };
};

// AuthorizationUtils keeps restrictions in module-level state, so every test restricting a role uses a fresh role id.
let restrictedRoleCount = 0;
const createRestrictedRole = (allowedPermissions: string[]) => {
	const roleId = `restricted-role-${++restrictedRoleCount}`;
	AuthorizationUtils.addRolePermissionWhiteList(roleId, allowedPermissions);
	return roleId;
};

describe('createAuthorizationFunctions', () => {
	describe('user context and readiness', () => {
		it('denies current-user checks when no user is logged in, even when room or scoped roles would grant', () => {
			const { hasAllPermission, hasAtLeastOnePermission, hasPermission } = setup({
				currentUserId: null,
				permissions: { 'edit-message': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
				subscriptionRoles: { 'room-1': ['owner'] },
			});

			expect(hasAllPermission('edit-message', 'room-1')).toBe(false);
			expect(hasAtLeastOnePermission('edit-message', 'room-1')).toBe(false);
			expect(hasPermission('edit-message', 'room-2', ['owner'])).toBe(false);
		});

		it('denies every check while the permissions cache is not ready, even for a qualifying role', () => {
			const { hasAllPermission, hasAtLeastOnePermission, userHasAllPermission } = setup({
				ready: false,
				userRoles: { 'current-user': ['admin'] },
				permissions: { 'view-room': ['admin'] },
			});

			expect(hasAllPermission('view-room')).toBe(false);
			expect(hasAtLeastOnePermission('view-room')).toBe(false);
			expect(userHasAllPermission('view-room', undefined, 'current-user')).toBe(false);
		});

		it('grants when the cache is ready and the user has a qualifying role', () => {
			const { hasAllPermission } = setup({
				userRoles: { 'current-user': ['admin'] },
				permissions: { 'view-room': ['admin'] },
			});

			expect(hasAllPermission('view-room')).toBe(true);
		});

		it('evaluates userHasAllPermission against the supplied user, not the current user', () => {
			const { userHasAllPermission } = setup({
				userRoles: { 'current-user': ['user'], 'other-user': ['admin'] },
				permissions: { 'manage-users': ['admin'] },
			});

			expect(userHasAllPermission('manage-users', undefined, 'other-user')).toBe(true);
			expect(userHasAllPermission('manage-users', undefined, 'current-user')).toBe(false);
		});

		it('denies userHasAllPermission when no user id is supplied', () => {
			const { userHasAllPermission } = setup({
				userRoles: { 'current-user': ['admin'] },
				permissions: { 'manage-users': ['admin'] },
			});

			expect(userHasAllPermission('manage-users', undefined, '')).toBe(false);
		});
	});

	describe('role resolution', () => {
		it("resolves a Users-scoped role from the supplied user's role list", () => {
			const { hasRole } = setup({
				userRoles: { 'user-1': ['admin', 'user'] },
				roleScopes: { admin: 'Users', moderator: 'Users' },
			});

			expect(hasRole('user-1', 'admin')).toBe(true);
			expect(hasRole('user-1', 'moderator')).toBe(false);
		});

		it('denies a Users-scoped role when the user data is unavailable', () => {
			const { hasRole } = setup({ roleScopes: { admin: 'Users' } });

			expect(hasRole('unknown-user', 'admin')).toBe(false);
		});

		it('resolves a Subscriptions-scoped role through the subscription for the supplied room', () => {
			const { hasRole, deps } = setup({
				roleScopes: { owner: 'Subscriptions' },
				subscriptionRoles: { 'room-1': ['owner'] },
			});

			expect(hasRole('user-1', 'owner', 'room-1')).toBe(true);
			expect(hasRole('user-1', 'owner', 'room-2')).toBe(false);
			expect(deps.hasSubscriptionRole).toHaveBeenCalledWith('room-1', 'owner');
		});

		it('denies a Subscriptions-scoped role when no room scope is supplied', () => {
			const { hasRole, deps } = setup({
				userRoles: { 'user-1': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
				subscriptionRoles: { 'room-1': ['owner'] },
			});

			expect(hasRole('user-1', 'owner')).toBe(false);
			expect(deps.hasSubscriptionRole).not.toHaveBeenCalled();
		});

		it("treats a role with unknown scope as Users-scoped and checks the user's role list", () => {
			const { hasRole, deps } = setup({
				userRoles: { 'user-1': ['custom-role'] },
				subscriptionRoles: { 'room-1': ['other-custom-role'] },
			});

			expect(hasRole('user-1', 'custom-role', 'room-1')).toBe(true);
			expect(hasRole('user-1', 'other-custom-role', 'room-1')).toBe(false);
			expect(deps.hasSubscriptionRole).not.toHaveBeenCalled();
		});

		it('denies a role whose scope is neither Users nor Subscriptions', () => {
			const { hasRole } = setup({
				userRoles: { 'user-1': ['odd-role'] },
				roleScopes: { 'odd-role': 'Rooms' as IRole['scope'] },
			});

			expect(hasRole('user-1', 'odd-role')).toBe(false);
		});
	});

	describe('permission decisions', () => {
		const world: World = {
			userRoles: { 'current-user': ['user'] },
			permissions: { 'create-c': ['user'], 'create-d': ['user'], 'view-logs': ['admin'] },
		};

		it('accepts a single permission id or an array of permission ids', () => {
			const { hasAllPermission } = setup(world);

			expect(hasAllPermission('create-c')).toBe(true);
			expect(hasAllPermission(['create-c'])).toBe(true);
			expect(hasAllPermission('view-logs')).toBe(false);
			expect(hasAllPermission(['view-logs'])).toBe(false);
		});

		it('requires every permission for hasAllPermission', () => {
			const { hasAllPermission } = setup(world);

			expect(hasAllPermission(['create-c', 'create-d'])).toBe(true);
			expect(hasAllPermission(['create-c', 'view-logs'])).toBe(false);
		});

		it('requires at least one permission for hasAtLeastOnePermission', () => {
			const { hasAtLeastOnePermission } = setup(world);

			expect(hasAtLeastOnePermission(['view-logs', 'create-c'])).toBe(true);
			expect(hasAtLeastOnePermission(['view-logs'])).toBe(false);
		});

		it('denies a permission that does not exist', () => {
			const { hasAllPermission, hasAtLeastOnePermission } = setup(world);

			expect(hasAllPermission('does-not-exist')).toBe(false);
			expect(hasAtLeastOnePermission('does-not-exist')).toBe(false);
		});

		it('denies a permission with no granting roles', () => {
			const { hasAllPermission } = setup({ ...world, permissions: { 'create-c': [] } });

			expect(hasAllPermission('create-c')).toBe(false);
		});

		it('grants when a supplied scoped role is one of the granting roles', () => {
			const { hasAllPermission } = setup({
				...world,
				permissions: { 'edit-message': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
			});

			expect(hasAllPermission('edit-message', 'room-1', ['owner'])).toBe(true);
			expect(hasAllPermission('edit-message', 'room-1')).toBe(false);
		});

		it('falls back to role resolution when the supplied scoped roles do not match', () => {
			const { hasAllPermission } = setup({
				...world,
				permissions: { 'edit-message': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
				subscriptionRoles: { 'room-1': ['owner'] },
			});

			expect(hasAllPermission('edit-message', 'room-1', ['moderator'])).toBe(true);
			expect(hasAllPermission('edit-message', 'room-2', ['moderator'])).toBe(false);
		});

		it("denies a permission restricted by one of the user's roles, even when another role grants it", () => {
			const restrictedRole = createRestrictedRole(['create-d']);
			const { hasAllPermission, hasAtLeastOnePermission } = setup({
				...world,
				userRoles: { 'current-user': ['user', restrictedRole] },
			});

			expect(hasAllPermission('create-c')).toBe(false);
			expect(hasAtLeastOnePermission(['create-c'])).toBe(false);
			expect(hasAllPermission('create-d')).toBe(true);
		});

		it('denies a restricted permission even when a supplied scoped role would grant it', () => {
			const restrictedRole = createRestrictedRole(['create-d']);
			const { hasAllPermission } = setup({
				...world,
				userRoles: { 'current-user': [restrictedRole] },
				permissions: { 'edit-message': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
			});

			expect(hasAllPermission('edit-message', 'room-1', ['owner'])).toBe(false);
		});

		it('makes the same decisions with hasPermission as with hasAllPermission', () => {
			const restrictedRole = createRestrictedRole(['create-d']);
			const { hasAllPermission, hasPermission } = setup({
				userRoles: { 'current-user': ['user'], 'restricted-user': [restrictedRole] },
				permissions: { 'create-c': ['user'], 'view-logs': ['admin'], 'edit-message': ['owner'] },
				roleScopes: { owner: 'Subscriptions' },
				subscriptionRoles: { 'room-1': ['owner'] },
			});
			const cases: Parameters<typeof hasPermission>[] = [
				['create-c'],
				['view-logs'],
				[['create-c', 'view-logs']],
				['does-not-exist'],
				['edit-message', 'room-1'],
				['edit-message', 'room-2'],
				['edit-message', 'room-2', ['owner']],
			];

			for (const args of cases) {
				expect(hasPermission(...args)).toBe(hasAllPermission(...args));
			}
			expect(cases.map((args) => hasPermission(...args))).toEqual([true, false, false, false, true, false, true]);
		});
	});
});
