import type { AuthorizationUtils as AuthorizationUtilsType } from './AuthorizationUtils';

describe('AuthorizationUtils', () => {
	let AuthorizationUtils: typeof AuthorizationUtilsType;

	beforeEach(async () => {
		jest.resetModules();
		({ AuthorizationUtils } = await import('./AuthorizationUtils'));
	});

	describe('addRolePermissionWhiteList', () => {
		it('should restrict the role to the registered permissions only', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room', 'view-joined-room']);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).toBe(true);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-joined-room', 'guest')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).toBe(true);
		});

		it('should extend the allowlist of an already registered role instead of replacing it', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-p-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-p-room', 'guest')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).toBe(true);
		});

		it('should keep a permission allowed when the same allowlist is registered again', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).toBe(true);
		});

		it('should keep the allowlists of different roles independent', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('anonymous', ['view-c-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-c-room', 'guest')).toBe(true);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'anonymous')).toBe(true);
		});

		it('should register the role without restricting any permission when the list is empty', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', []);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).toBe(true);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).toBe(false);
		});

		it('should throw and register nothing when the role id is empty', () => {
			expect(() => AuthorizationUtils.addRolePermissionWhiteList('', ['view-d-room'])).toThrow(new Error('invalid-param'));

			expect(AuthorizationUtils.hasRestrictionsToRole('')).toBe(false);
		});

		it('should throw and register nothing when the permission list is missing', () => {
			expect(() => AuthorizationUtils.addRolePermissionWhiteList('guest', undefined as unknown as string[])).toThrow(
				new Error('invalid-param'),
			);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).toBe(false);
		});
	});

	describe('isPermissionRestrictedForRole', () => {
		it('should not restrict any permission for a role without registered restrictions', () => {
			expect(AuthorizationUtils.hasRestrictionsToRole('user')).toBe(false);
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'user')).toBe(false);
		});

		it('should throw when the role id is missing', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRole('create-c', undefined as unknown as string)).toThrow(
				new Error('invalid-param'),
			);
		});

		it('should throw when the permission id is empty', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRole('', 'guest')).toThrow(new Error('invalid-param'));
		});
	});

	describe('isPermissionRestrictedForRoleList', () => {
		beforeEach(() => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('anonymous', ['create-c']);
		});

		it('should return false when every role in the list allows the permission', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('view-d-room', ['user', 'guest'])).toBe(false);
		});

		it('should return true when any role in the list restricts the permission, wherever it appears', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', ['user', 'guest'])).toBe(true);
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', ['guest', 'anonymous'])).toBe(true);
		});

		it('should return false for an empty role list', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', [])).toBe(false);
		});

		it('should throw when the role list is missing', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', undefined as unknown as string[])).toThrow(
				new Error('invalid-param'),
			);
		});

		it('should throw when the permission id is empty, even for an empty role list', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRoleList('', [])).toThrow(new Error('invalid-param'));
		});
	});
});
