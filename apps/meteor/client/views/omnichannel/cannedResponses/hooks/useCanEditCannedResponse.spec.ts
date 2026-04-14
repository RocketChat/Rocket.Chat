import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCanEditCannedResponse } from './useCanEditCannedResponse';

describe('useCanEditCannedResponse', () => {
	const mockCannedItem = {
		_id: 'test-id',
		shortcut: 'test',
		text: 'Test response',
		scope: 'global',
		tags: [],
		_createdAt: new Date(),
		_updatedAt: new Date(),
		createdBy: {
			_id: 'user-id',
			username: 'testuser',
		},
	};

	const userScopedItem = {
		...mockCannedItem,
		scope: 'user',
	};

	it('should return true when user can save canned responses', () => {
		const { result } = renderHook(() => useCanEditCannedResponse(mockCannedItem), {
			wrapper: mockAppRoot().withPermission('save-canned-responses').build(),
		});

		expect(result.current).toBe(true);
	});

	it('should return true when user has view-all-canned-responses permission and item scope is not global', () => {
		const departmentItem = { ...mockCannedItem, scope: 'department' };
		const { result } = renderHook(() => useCanEditCannedResponse(departmentItem), {
			wrapper: mockAppRoot().withPermission('view-all-canned-responses').build(),
		});

		expect(result.current).toBe(true);
	});

	it('should return false when user has view-all-canned-responses permission but item scope is global', () => {
		const { result } = renderHook(() => useCanEditCannedResponse(mockCannedItem), {
			wrapper: mockAppRoot().withPermission('view-all-canned-responses').build(),
		});

		expect(result.current).toBe(false);
	});

	it('should return true when item scope is user', () => {
		const userItem = { ...mockCannedItem, scope: 'user' };
		const { result } = renderHook(() => useCanEditCannedResponse(userItem), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBe(true);
	});

	it('should return false when user has no permissions and item scope is global', () => {
		const { result } = renderHook(() => useCanEditCannedResponse(mockCannedItem), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBe(false);
	});

	it('should return true when user has save-canned-responses permission and item scope is user', () => {
		const { result } = renderHook(() => useCanEditCannedResponse(userScopedItem), {
			wrapper: mockAppRoot().withPermission('save-canned-responses').build(),
		});

		expect(result.current).toBe(true);
	});
});
