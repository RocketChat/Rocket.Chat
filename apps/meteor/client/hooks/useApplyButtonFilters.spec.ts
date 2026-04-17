import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useApplyButtonAuthFilter } from './useApplyButtonFilters';

describe('useApplyButtonAuthFilter', () => {
	describe('Role-based filtering', () => {
		it('should filter button when user does not have required role (hasAllRoles)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllRoles: ['admin'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot()
					.withJohnDoe({ roles: ['user'] })
					.build(),
			});

			expect(result.current(button)).toBe(false);
		});

		it('should show button when user has required role (hasAllRoles)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllRoles: ['admin'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRole('admin').build(),
			});

			expect(result.current(button)).toBe(true);
		});

		it('should filter button when user does not have any required role (hasOneRole)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasOneRole: ['admin', 'moderator'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot()
					.withJohnDoe({ roles: ['user'] })
					.build(),
			});

			expect(result.current(button)).toBe(false);
		});

		it('should show button when user has at least one of the required roles (hasOneRole)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasOneRole: ['admin', 'moderator'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRole('moderator').build(),
			});

			expect(result.current(button)).toBe(true);
		});

		it('should show button when no role filter is specified', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot()
					.withJohnDoe({ roles: ['user'] })
					.build(),
			});

			expect(result.current(button)).toBe(true);
		});

		it('should filter button when user is not logged in and role is required (hasAllRoles)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllRoles: ['admin'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withAnonymous().build(),
			});

			expect(result.current(button)).toBe(false);
		});
	});

	describe('Permission-based filtering', () => {
		it('should filter button when user does not have required permission (hasAllPermissions)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllPermissions: ['manage-apps'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().build(),
			});

			expect(result.current(button)).toBe(false);
		});

		it('should show button when user has required permission (hasAllPermissions)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllPermissions: ['manage-apps'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withPermission('manage-apps').build(),
			});

			expect(result.current(button)).toBe(true);
		});

		it('should show button when user has at least one of the required permissions (hasOnePermission)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasOnePermission: ['manage-apps', 'manage-users'],
				},
			};

			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withPermission('manage-apps').build(),
			});

			expect(result.current(button)).toBe(true);
		});
	});

	describe('Combined filters', () => {
		it('should apply both role and permission filters (AND logic)', () => {
			const button: IUIActionButton = {
				appId: 'test-app',
				actionId: 'test-action',
				labelI18n: 'test_label',
				context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				when: {
					hasAllRoles: ['admin'],
					hasAllPermissions: ['manage-apps'],
				},
			};

			const { result: result1 } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot()
					.withJohnDoe({ roles: ['user'] })
					.build(),
			});
			expect(result1.current(button)).toBe(false);

			const { result: result2 } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot()
					.withJohnDoe({ roles: ['user'] })
					.withPermission('manage-apps')
					.build(),
			});
			expect(result2.current(button)).toBe(false);

			const { result: result3 } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRole('admin').withPermission('manage-apps').build(),
			});
			expect(result3.current(button)).toBe(true);
		});
	});
});
