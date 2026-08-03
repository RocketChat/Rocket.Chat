import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useThreadMessagesQuery } from './useThreadMessagesQuery';
import FakeRoomProvider from '../../../../../../tests/mocks/client/FakeRoomProvider';

const tmid = 'thread-main-message-id';

const setConfig = (value?: string) => {
	window.history.replaceState(null, '', value === undefined ? '/' : `/?threadMessagesSize=${value}`);
};

const renderThreadMessagesQuery = () => {
	const getThreadMessages = jest.fn().mockResolvedValue({ messages: [], count: 0, offset: 0, total: 0 });

	const { result } = renderHook(() => useThreadMessagesQuery(tmid), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/chat.getThreadMessages', getThreadMessages)
			.withEndpoint('POST', '/v1/chat.readThread', jest.fn().mockResolvedValue({ success: true }))
			.wrap((children) => <FakeRoomProvider roomOverrides={{ t: 'c' }}>{children}</FakeRoomProvider>)
			.build(),
	});

	return { result, getThreadMessages };
};

describe('useThreadMessagesQuery', () => {
	afterEach(() => {
		setConfig();
		jest.clearAllMocks();
	});

	it('should request the default page size when `threadMessagesSize` is absent', async () => {
		const { getThreadMessages } = renderThreadMessagesQuery();

		await waitFor(() => expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ tmid, offset: 0, count: 50 })));
	});

	it('should request the configured page size when `threadMessagesSize` is a valid number', async () => {
		setConfig('20');

		const { getThreadMessages } = renderThreadMessagesQuery();

		await waitFor(() => expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ count: 20 })));
	});

	it('should fall back to the default page size when `threadMessagesSize` is not a number', async () => {
		setConfig('not-a-number');

		const { getThreadMessages } = renderThreadMessagesQuery();

		await waitFor(() => expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ count: 50 })));
		expect(getThreadMessages).not.toHaveBeenCalledWith(expect.objectContaining({ count: NaN }));
	});

	it('should fall back to the default page size when `threadMessagesSize` is empty', async () => {
		setConfig('');

		const { getThreadMessages } = renderThreadMessagesQuery();

		await waitFor(() => expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ count: 50 })));
	});

	it('should request a finite page size on `loadMessageAround` when `threadMessagesSize` is not a number', async () => {
		setConfig('not-a-number');

		const { result, getThreadMessages } = renderThreadMessagesQuery();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		await result.current.loadMessageAround('some-message-id');

		expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ aroundId: 'some-message-id', count: 50 }));
	});
});
