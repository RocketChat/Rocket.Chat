import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useThreadsList } from './useThreadsList';
import { createFakeRoom } from '../../../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'c' });

const setConfig = (value?: string) => {
	window.history.replaceState(null, '', value === undefined ? '/' : `/?threadsListSize=${value}`);
};

const renderThreadsList = () => {
	const getThreadsList = jest.fn().mockResolvedValue({ threads: [], count: 0, offset: 0, total: 0 });

	const { result } = renderHook(() => useThreadsList({ rid: fakeRoom._id }), {
		wrapper: mockAppRoot().withJohnDoe().withEndpoint('GET', '/v1/chat.getThreadsList', getThreadsList).build(),
	});

	return { result, getThreadsList };
};

describe('useThreadsList', () => {
	afterEach(() => {
		setConfig();
		jest.clearAllMocks();
	});

	it('should request the default page size when `threadsListSize` is absent', async () => {
		const { getThreadsList } = renderThreadsList();

		await waitFor(() => expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ rid: fakeRoom._id, offset: 0, count: 10 })));
	});

	it('should request the configured page size when `threadsListSize` is a valid number', async () => {
		setConfig('25');

		const { getThreadsList } = renderThreadsList();

		await waitFor(() => expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ count: 25 })));
	});

	it('should fall back to the default page size when `threadsListSize` is not a number', async () => {
		setConfig('not-a-number');

		const { getThreadsList } = renderThreadsList();

		await waitFor(() => expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ count: 10 })));
		expect(getThreadsList).not.toHaveBeenCalledWith(expect.objectContaining({ count: NaN }));
	});

	it('should fall back to the default page size when `threadsListSize` is empty', async () => {
		setConfig('');

		const { getThreadsList } = renderThreadsList();

		await waitFor(() => expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ count: 10 })));
	});
});
