import { AuthorizationUtils } from '@rocket.chat/authorization/dist/AuthorizationUtils';
import type { IPermission, IRole, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import type { AuthorizationDeps } from '../../../../lib/authorization/createAuthorizationFunctions';
import { createAuthorizationFunctions } from '../../../../lib/authorization/createAuthorizationFunctions';

type FakeState = {
	currentUserId?: IUser['_id'];
	ready?: boolean;
	users?: Record<IUser['_id'], IRole['_id'][]>;
	permissions?: Record<IPermission['_id'], IRole['_id'][]>;
	roles?: Record<IRole['_id'], IRole['scope']>;
	subscriptions?: Record<string, IRole['_id'][]>;
};

const createDeps = ({
	currentUserId,
	ready = true,
	users = {},
	permissions = {},
	roles = {},
	subscriptions = {},
}: FakeState): AuthorizationDeps => ({
	getCurrentUserId: () => currentUserId,
	getUserRoles: (userId) => users[userId],
	getPermission: (permissionId) =>
		permissions[permissionId] ? ({ _id: permissionId, roles: permissions[permissionId] } as IPermission) : undefined,
	getRoleScope: (roleId) => roles[roleId],
	hasSubscriptionRole: (rid, roleId) => subscriptions[rid]?.includes(roleId) ?? false,
	isReady: () => ready,
});

const baseState: FakeState = {
	currentUserId: 'current-user',
	users: {
		'current-user': ['user'],
		'admin-user': ['admin'],
	},
	permissions: {
		'view-room': ['user', 'admin'],
		'manage-users': ['admin'],
		'edit-room': ['owner'],
		'no-roles': [],
	},
	roles: {
		user: 'Users',
		admin: 'Users',
		owner: 'Subscriptions',
	},
	subscriptions: {
		'room-1': ['owner'],
	},
};

const create = (overrides: FakeState = {}) => createAuthorizationFunctions(createDeps({ ...baseState, ...overrides }));

describe('createAuthorizationFunctions', () => {
	describe('user context and readiness', () => {
		it('should deny current-user checks when nobody is logged in', () => {
			const { hasAllPermission, hasAtLeastOnePermission, hasPermission } = create({ currentUserId: undefined });

			expect(hasAllPermission('view-room')).to.be.false;
			expect(hasAtLeastOnePermission(['view-room', 'manage-users'])).to.be.false;
			expect(hasPermission('view-room')).to.be.false;
			// grants that do not depend on the user's own roles must also be denied
			expect(hasAllPermission('edit-room', 'room-1')).to.be.false;
			expect(hasAllPermission('edit-room', undefined, ['owner'])).to.be.false;
		});

		it('should deny every check while the permissions cache is not ready, even for a qualifying role', () => {
			const { hasAllPermission, hasAtLeastOnePermission, userHasAllPermission } = create({ currentUserId: 'admin-user', ready: false });

			expect(hasAllPermission('manage-users')).to.be.false;
			expect(hasAtLeastOnePermission('manage-users')).to.be.false;
			expect(userHasAllPermission('manage-users', undefined, 'admin-user')).to.be.false;
		});

		it('should allow a qualifying role once the cache is ready', () => {
			const { hasAllPermission } = create({ currentUserId: 'admin-user' });

			expect(hasAllPermission('manage-users')).to.be.true;
		});

		it('should evaluate userHasAllPermission against the supplied user, not the current user', () => {
			const asRegularUser = create({ currentUserId: 'current-user' });
			expect(asRegularUser.hasAllPermission('manage-users')).to.be.false;
			expect(asRegularUser.userHasAllPermission('manage-users', undefined, 'admin-user')).to.be.true;

			const asAdmin = create({ currentUserId: 'admin-user' });
			expect(asAdmin.hasAllPermission('manage-users')).to.be.true;
			expect(asAdmin.userHasAllPermission('manage-users', undefined, 'current-user')).to.be.false;
		});
	});

	describe('role resolution', () => {
		it('should resolve user-scoped roles from the supplied user role list', () => {
			const { hasRole } = create();

			expect(hasRole('admin-user', 'admin')).to.be.true;
			expect(hasRole('current-user', 'admin')).to.be.false;
		});

		it('should deny a user-scoped role when the user data is unavailable', () => {
			const { hasRole, userHasAllPermission } = create();

			expect(hasRole('unknown-user', 'user')).to.be.false;
			expect(userHasAllPermission('view-room', undefined, 'unknown-user')).to.be.false;
		});

		it('should resolve subscription-scoped roles for the supplied room only', () => {
			const { hasRole } = create();

			expect(hasRole('current-user', 'owner', 'room-1')).to.be.true;
			expect(hasRole('current-user', 'owner', 'room-2')).to.be.false;
		});

		it('should deny a subscription-scoped role when no room scope is supplied', () => {
			const { hasRole, hasAllPermission } = create();

			expect(hasRole('current-user', 'owner')).to.be.false;
			expect(hasAllPermission('edit-room')).to.be.false;
			expect(hasAllPermission('edit-room', 'room-1')).to.be.true;
		});

		it('should default an unknown role scope to Users and check the user role list', () => {
			const { hasRole, hasAllPermission } = create({
				users: { 'current-user': ['custom-role'] },
				permissions: { 'custom-permission': ['custom-role'] },
				roles: {},
			});

			expect(hasRole('current-user', 'custom-role')).to.be.true;
			expect(hasRole('current-user', 'custom-role', 'room-1')).to.be.true;
			expect(hasRole('current-user', 'other-role')).to.be.false;
			expect(hasAllPermission('custom-permission')).to.be.true;
		});

		it('should deny a role whose scope is neither Users nor Subscriptions', () => {
			const { hasRole } = create({
				users: { 'current-user': ['odd-role'] },
				roles: { 'odd-role': 'Other' as IRole['scope'] },
			});

			expect(hasRole('current-user', 'odd-role')).to.be.false;
		});
	});

	describe('permission decisions', () => {
		it('should accept a single permission id or an array of ids', () => {
			const { hasAllPermission } = create();

			expect(hasAllPermission('view-room')).to.be.true;
			expect(hasAllPermission(['view-room'])).to.be.true;
			expect(hasAllPermission('manage-users')).to.be.false;
			expect(hasAllPermission(['manage-users'])).to.be.false;
		});

		it('should require every permission for hasAllPermission', () => {
			const { hasAllPermission } = create();

			expect(hasAllPermission(['view-room', 'manage-users'])).to.be.false;
			expect(create({ currentUserId: 'admin-user' }).hasAllPermission(['view-room', 'manage-users'])).to.be.true;
		});

		it('should require at least one permission for hasAtLeastOnePermission', () => {
			const { hasAtLeastOnePermission } = create();

			expect(hasAtLeastOnePermission(['manage-users', 'view-room'])).to.be.true;
			expect(hasAtLeastOnePermission(['manage-users', 'no-roles'])).to.be.false;
		});

		it('should honour the room scope in hasAtLeastOnePermission', () => {
			const { hasAtLeastOnePermission } = create();

			expect(hasAtLeastOnePermission(['manage-users', 'edit-room'])).to.be.false;
			expect(hasAtLeastOnePermission(['manage-users', 'edit-room'], 'room-1')).to.be.true;
		});

		it('should deny a permission that does not exist', () => {
			const { hasAllPermission, hasAtLeastOnePermission } = create({ currentUserId: 'admin-user' });

			expect(hasAllPermission('missing-permission')).to.be.false;
			expect(hasAtLeastOnePermission('missing-permission')).to.be.false;
		});

		it('should deny a permission with no granting roles', () => {
			const { hasAllPermission } = create({ currentUserId: 'admin-user' });

			expect(hasAllPermission('no-roles')).to.be.false;
		});

		it('should grant a permission when a supplied scoped role is one of its granting roles', () => {
			const { hasAllPermission } = create();

			expect(hasAllPermission('edit-room')).to.be.false;
			expect(hasAllPermission('edit-room', undefined, ['owner'])).to.be.true;
		});

		it('should fall back to ordinary role resolution when supplied scoped roles do not match', () => {
			const { hasAllPermission } = create();

			expect(hasAllPermission('view-room', undefined, ['moderator'])).to.be.true;
			expect(hasAllPermission('manage-users', undefined, ['moderator'])).to.be.false;
			expect(hasAllPermission('edit-room', 'room-1', ['moderator'])).to.be.true;
		});

		describe('restricted roles', () => {
			// AuthorizationUtils keeps its whitelist in module state, so use role ids no other spec touches.
			const restrictedRole = 'core-2706-restricted-role';

			before(() => {
				AuthorizationUtils.addRolePermissionWhiteList(restrictedRole, ['view-room']);
			});

			it('should allow a whitelisted permission for a restricted role', () => {
				const { hasAllPermission } = create({ users: { 'current-user': [restrictedRole, 'user'] } });

				expect(hasAllPermission('view-room')).to.be.true;
			});

			it('should deny a non-whitelisted permission even when another role of the user grants it', () => {
				const { hasAllPermission, hasAtLeastOnePermission, userHasAllPermission } = create({
					users: { 'current-user': [restrictedRole, 'admin'] },
				});

				expect(hasAllPermission('manage-users')).to.be.false;
				expect(hasAtLeastOnePermission(['manage-users'])).to.be.false;
				expect(userHasAllPermission('manage-users', undefined, 'current-user')).to.be.false;
			});

			it('should deny a non-whitelisted permission even when a supplied scoped role grants it', () => {
				const { hasAllPermission } = create({ users: { 'current-user': [restrictedRole] } });

				expect(hasAllPermission('edit-room', 'room-1', ['owner'])).to.be.false;
			});

			it('should only fail the restricted permission within hasAtLeastOnePermission', () => {
				const { hasAtLeastOnePermission } = create({ users: { 'current-user': [restrictedRole, 'admin'] } });

				expect(hasAtLeastOnePermission(['manage-users', 'view-room'])).to.be.true;
			});
		});

		it('should make the same decisions from hasPermission and hasAllPermission', () => {
			const cases: [IPermission['_id'] | IPermission['_id'][], string | undefined, IRole['_id'][] | undefined][] = [
				['view-room', undefined, undefined],
				['manage-users', undefined, undefined],
				[['view-room', 'manage-users'], undefined, undefined],
				['edit-room', undefined, undefined],
				['edit-room', 'room-1', undefined],
				['edit-room', undefined, ['owner']],
				['missing-permission', undefined, undefined],
			];

			for (const state of [{}, { currentUserId: 'admin-user' }, { currentUserId: undefined }, { ready: false }]) {
				const { hasPermission, hasAllPermission } = create(state);

				for (const [permissions, scope, scopedRoles] of cases) {
					expect(hasPermission(permissions, scope, scopedRoles)).to.equal(hasAllPermission(permissions, scope, scopedRoles));
				}
			}
		});
	});
});
