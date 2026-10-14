import { afterEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { createFakeMessage } from '../../../../tests/mocks/data';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const MessageListContextMock = {
	useMessageListReadReceipts: fn<FunctionLike>(),
};

const { useMessageListReadReceipts } = MessageListContextMock as unknown as typeof import('../list/MessageListContext');

const { useReadReceiptsDetailsAction } = proxyquire
	.noCallThru()
	.load<typeof import('./useReadReceiptsDetailsAction')>('./useReadReceiptsDetailsAction', {
		'../list/MessageListContext': MessageListContextMock,
	});

const useMessageListReadReceiptsMocked = mocked(useMessageListReadReceipts);

describe('useReadReceiptsDetailsAction', () => {
	const message = createFakeMessage({ _id: 'messageId' });

	afterEach(() => {
		mocker.clearAllMocks();
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
