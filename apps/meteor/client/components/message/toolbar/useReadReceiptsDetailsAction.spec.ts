import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { MessageListContext, messageListContextDefaultValue } from '../list/MessageListContext';

const renderWithReadReceipts = (readReceipts: { enabled: boolean; storeUsers: boolean }) => {
	const AppRoot = mockAppRoot().build();
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(
			AppRoot,
			null,
			createElement(MessageListContext.Provider, { value: { ...messageListContextDefaultValue, readReceipts } }, children),
		);

	return renderHook(() => useReadReceiptsDetailsAction(createFakeMessage({ _id: 'messageId' })), { wrapper }).result.current;
};

describe('useReadReceiptsDetailsAction', () => {
	it('should return null if read receipts are not enabled', () => {
		expect(renderWithReadReceipts({ enabled: false, storeUsers: true })).toBeNull();
	});

	it('should return null if read receipts store users is not enabled', () => {
		expect(renderWithReadReceipts({ enabled: true, storeUsers: false })).toBeNull();
	});

	it('should return a message action config', () => {
		expect(renderWithReadReceipts({ enabled: true, storeUsers: true })).toEqual(
			expect.objectContaining({
				id: 'receipt-detail',
				icon: 'check-double',
				label: 'Read_Receipts',
			}),
		);
	});
});
