import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { useMessageListReadReceipts } from '../list/MessageListContext';

jest.mock('../list/MessageListContext', () => ({
	useMessageListReadReceipts: jest.fn(),
}));

const useMessageListReadReceiptsMocked = jest.mocked(useMessageListReadReceipts);

describe('useReadReceiptsDetailsAction', () => {
	const message = createFakeMessage({ _id: 'messageId' });

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return null if read receipts are not enabled', () => {
		useMessageListReadReceiptsMocked.mockReturnValue({ enabled: false, storeUsers: true });

		const { result } = renderHook(() => useReadReceiptsDetailsAction(message), { wrapper: mockAppRoot().build() });

		expect(result.current).toBeNull();
	});

	it('should return null if read receipts store users is not enabled', () => {
		useMessageListReadReceiptsMocked.mockReturnValue({ enabled: true, storeUsers: false });

		const { result } = renderHook(() => useReadReceiptsDetailsAction(message), { wrapper: mockAppRoot().build() });

		expect(result.current).toBeNull();
	});

	it('should return a message action config', () => {
		useMessageListReadReceiptsMocked.mockReturnValue({ enabled: true, storeUsers: true });

		const { result } = renderHook(() => useReadReceiptsDetailsAction(message), { wrapper: mockAppRoot().build() });

		expect(result.current).toEqual(
			expect.objectContaining({
				id: 'receipt-detail',
				icon: 'check-double',
				label: 'Read_Receipts',
			}),
		);
	});
});
