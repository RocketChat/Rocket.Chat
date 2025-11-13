import type { ILivechatMonitor, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useMonitorsList } from './useMonitorsList';
import { createFakeMonitor } from '../../../../tests/mocks/data';

const formatMonitorItem = (monitor: Serialized<ILivechatMonitor>) => ({
	_id: monitor._id,
	label: monitor.username,
	value: monitor._id,
});

const mockGetMonitors = jest.fn();

const appRoot = new MockedAppRootBuilder().withEndpoint('GET', '/v1/livechat/monitors', mockGetMonitors);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch monitors', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeMonitor());

	mockGetMonitors.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const monitors = data.slice(offset, offset + count);

		return {
			monitors,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useMonitorsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatMonitorItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatMonitorItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetMonitors).toHaveBeenCalledTimes(2);
});
