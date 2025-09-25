import { AuthorizationUtils } from './AuthorizationUtils';

const fakeRole = 'admin';
const fakePermissionId = 'access-permissions';

beforeAll(() => {
	AuthorizationUtils.addRolePermissionDisabledList(fakeRole, [fakePermissionId]);
	AuthorizationUtils.addRolePermissionWhiteList(fakeRole, [fakePermissionId]);
});

it('should return true if the currentPermission and role is the same added to the disabledRolePermissions list', () => {
	const currentPermission = fakePermissionId;
	const result = AuthorizationUtils.isPermissionDisabledForRole(currentPermission, fakeRole);
	expect(result).toBe(true);
});

it('should return false if the currentPermission and role is NOT the same added to the disabledRolePermissions list', () => {
	const currentPermission = 'any-permission';
	const result = AuthorizationUtils.isPermissionDisabledForRole(currentPermission, fakeRole);
	expect(result).toBe(false);
});

it('should return true if the currentPermission and role is NOT the same added to the restrictedRolePermissions list', () => {
	const currentPermission = 'any-permission';
	const result = AuthorizationUtils.isPermissionRestrictedForRole(currentPermission, fakeRole);
	expect(result).toBe(true);
});

it('should return false if the currentPermission and role is the same added to the restrictedRolePermissions list', () => {
	const currentPermission = fakePermissionId;
	const result = AuthorizationUtils.isPermissionRestrictedForRole(currentPermission, fakeRole);
	expect(result).toBe(false);
});
