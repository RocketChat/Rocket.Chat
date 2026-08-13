import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useApplyButtonAuthFilter, useApplyButtonFilters } from './useApplyButtonFilters';
import FakeRoomProvider from '../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../tests/mocks/data';

const buttonRequiringRole = (role: string): IUIActionButton => ({
	appId: 'test-app',
	actionId: 'test-action',
	labelI18n: 'test_label',
	context: UIActionButtonContext.ROOM_ACTION,
	when: {
		hasOneRole: [role],
	},
});

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

	describe('Room-scoped roles', () => {
		// `owner`, `moderator` and `leader` are scoped to `Subscriptions`: the user holds them
		// in one room, so the check only passes when it is given that room.
		const room = createFakeRoom({ _id: 'room-with-role' });

		it('should show button when the user holds the role in the given room', () => {
			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRoleScoped('owner', room._id).build(),
			});

			expect(result.current(buttonRequiringRole('owner'), room)).toBe(true);
		});

		it('should filter button when no room is given', () => {
			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRoleScoped('owner', room._id).build(),
			});

			expect(result.current(buttonRequiringRole('owner'))).toBe(false);
		});

		it('should filter button when the user holds the role in another room', () => {
			const { result } = renderHook(() => useApplyButtonAuthFilter(), {
				wrapper: mockAppRoot().withJohnDoe().withRoleScoped('owner', 'another-room').build(),
			});

			expect(result.current(buttonRequiringRole('owner'), room)).toBe(false);
		});
	});
});

describe('useApplyButtonFilters', () => {
	const rid: IRoom['_id'] = 'room-with-role';

	const withRoomContext = (children: ReactNode) => createElement(FakeRoomProvider, { roomOverrides: { _id: rid, t: 'c' } }, children);

	it('should scope the role filter to the room in context', () => {
		const { result } = renderHook(() => useApplyButtonFilters(), {
			wrapper: mockAppRoot().withJohnDoe().withRoleScoped('owner', rid).wrap(withRoomContext).build(),
		});

		expect(result.current(buttonRequiringRole('owner'))).toBe(true);
	});

	it('should filter button when the user holds the role in another room', () => {
		const { result } = renderHook(() => useApplyButtonFilters(), {
			wrapper: mockAppRoot().withJohnDoe().withRoleScoped('owner', 'another-room').wrap(withRoomContext).build(),
		});

		expect(result.current(buttonRequiringRole('owner'))).toBe(false);
	});

	it('should still match a workspace-wide role in a room', () => {
		const { result } = renderHook(() => useApplyButtonFilters(), {
			wrapper: mockAppRoot().withJohnDoe().withRole('admin').wrap(withRoomContext).build(),
		});

		expect(result.current(buttonRequiringRole('admin'))).toBe(true);
	});
});
