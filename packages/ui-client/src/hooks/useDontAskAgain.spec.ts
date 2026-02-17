import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDontAskAgain } from './useDontAskAgain';

const PREFERENCE = 'dontAskAgainList';

describe('useDontAskAgain', () => {
	it('should return false when dontAskAgainList is empty', () => {
		const { result } = renderHook(() => useDontAskAgain('delete-message'), {
			wrapper: mockAppRoot()
				.withUserPreference(PREFERENCE, [])
				.build(),
		});

		expect(result.current).toBe(false);
	});

	it('should return true when the action exists in dontAskAgainList', () => {
		const { result } = renderHook(() => useDontAskAgain('delete-message'), {
			wrapper: mockAppRoot()
				.withUserPreference(PREFERENCE, [
					{ action: 'delete-message', label: 'Delete message confirmation' },
				])
				.build(),
		});

		expect(result.current).toBe(true);
	});

	it('should return false when the action does not exist in dontAskAgainList', () => {
		const { result } = renderHook(() => useDontAskAgain('leave-room'), {
			wrapper: mockAppRoot()
				.withUserPreference(PREFERENCE, [
					{ action: 'delete-message', label: 'Delete message confirmation' },
					{ action: 'archive-room', label: 'Archive room confirmation' },
				])
				.build(),
		});

		expect(result.current).toBe(false);
	});
});'@rocket.chat/mock-providers'