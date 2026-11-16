import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { createFakeMessage } from '../../../../tests/mocks/data';

describe('useReadReceiptsDetailsAction', () => {
	const message = createFakeMessage({ _id: 'messageId' });

	it('should return null if read receipts are not enabled', () => {
		const { result } = renderHook(() => useReadReceiptsDetailsAction(message, { enabled: false, storeUsers: true }), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBeNull();
	});

	it('should return null if read receipts store users is not enabled', () => {
		const { result } = renderHook(() => useReadReceiptsDetailsAction(message, { enabled: true, storeUsers: false }), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBeNull();
	});

	it('should return a message action config', () => {
		const { result } = renderHook(() => useReadReceiptsDetailsAction(message, { enabled: true, storeUsers: true }), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toEqual(
			expect.objectContaining({
				id: 'receipt-detail',
				icon: 'check-double',
				label: 'Read_Receipts',
			}),
		);
	});
});
