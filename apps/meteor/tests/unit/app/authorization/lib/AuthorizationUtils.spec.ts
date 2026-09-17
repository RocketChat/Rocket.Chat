import { expect } from 'chai';
import proxyquire from 'proxyquire';

import type { AuthorizationUtils as AuthorizationUtilsType } from '../../../../../app/authorization/lib/AuthorizationUtils';

describe('AuthorizationUtils', () => {
	let AuthorizationUtils: typeof AuthorizationUtilsType;

	beforeEach(() => {
		({ AuthorizationUtils } = proxyquire.noPreserveCache().load('../../../../../app/authorization/lib/AuthorizationUtils', {}));
	});

	describe('addRolePermissionWhiteList', () => {
		it('should restrict the role to the registered permissions only', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room', 'view-joined-room']);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).to.be.true;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-joined-room', 'guest')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).to.be.true;
		});

		it('should extend the allowlist of an already registered role instead of replacing it', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-p-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-p-room', 'guest')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).to.be.true;
		});

		it('should keep a permission allowed when the same allowlist is registered again', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'guest')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).to.be.true;
		});

		it('should keep the allowlists of different roles independent', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('anonymous', ['view-c-room']);

			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-c-room', 'guest')).to.be.true;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('view-d-room', 'anonymous')).to.be.true;
		});

		it('should register the role without restricting any permission when the list is empty', () => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', []);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).to.be.true;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'guest')).to.be.false;
		});

		it('should throw and register nothing when the role id is empty', () => {
			expect(() => AuthorizationUtils.addRolePermissionWhiteList('', ['view-d-room'])).to.throw(Error, /^invalid-param$/);

			expect(AuthorizationUtils.hasRestrictionsToRole('')).to.be.false;
		});

		it('should throw and register nothing when the permission list is missing', () => {
			expect(() => AuthorizationUtils.addRolePermissionWhiteList('guest', undefined as unknown as string[])).to.throw(
				Error,
				/^invalid-param$/,
			);

			expect(AuthorizationUtils.hasRestrictionsToRole('guest')).to.be.false;
		});
	});

	describe('isPermissionRestrictedForRole', () => {
		it('should not restrict any permission for a role without registered restrictions', () => {
			expect(AuthorizationUtils.hasRestrictionsToRole('user')).to.be.false;
			expect(AuthorizationUtils.isPermissionRestrictedForRole('create-c', 'user')).to.be.false;
		});

		it('should throw when the role id is missing', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRole('create-c', undefined as unknown as string)).to.throw(
				Error,
				/^invalid-param$/,
			);
		});

		it('should throw when the permission id is empty', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRole('', 'guest')).to.throw(Error, /^invalid-param$/);
		});
	});

	describe('isPermissionRestrictedForRoleList', () => {
		beforeEach(() => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', ['view-d-room']);
			AuthorizationUtils.addRolePermissionWhiteList('anonymous', ['create-c']);
		});

		it('should return false when every role in the list allows the permission', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('view-d-room', ['user', 'guest'])).to.be.false;
		});

		it('should return true when any role in the list restricts the permission, wherever it appears', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', ['user', 'guest'])).to.be.true;
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', ['guest', 'anonymous'])).to.be.true;
		});

		it('should return false for an empty role list', () => {
			expect(AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', [])).to.be.false;
		});

		it('should throw when the role list is missing', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRoleList('create-c', undefined as unknown as string[])).to.throw(
				Error,
				/^invalid-param$/,
			);
		});

		it('should throw when the permission id is empty, even for an empty role list', () => {
			expect(() => AuthorizationUtils.isPermissionRestrictedForRoleList('', [])).to.throw(Error, /^invalid-param$/);
		});
	});
});
