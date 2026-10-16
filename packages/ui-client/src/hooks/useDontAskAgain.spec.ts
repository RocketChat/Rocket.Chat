import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDontAskAgain } from './useDontAskAgain';

it('should return true if action exists in dontAskAgainList', () => {
	const { result } = renderHook(() => useDontAskAgain('delete'), {
		wrapper: mockAppRoot()
			.withUserPreference('dontAskAgainList', [{ action: 'delete', label: 'Delete message' }])
			.build(),
	});

	expect(result.current).toBe(true);
});

it('should return false if action does not exist in dontAskAgainList', () => {
	const { result } = renderHook(() => useDontAskAgain('edit'), {
		wrapper: mockAppRoot()
			.withUserPreference('dontAskAgainList', [{ action: 'delete', label: 'Delete message' }])
			.build(),
	});

	expect(result.current).toBe(false);
});

it('should return false if dontAskAgainList is undefined', () => {
	const { result } = renderHook(() => useDontAskAgain('delete'), {
		wrapper: mockAppRoot().build(),
	});

	expect(result.current).toBe(false);
});
