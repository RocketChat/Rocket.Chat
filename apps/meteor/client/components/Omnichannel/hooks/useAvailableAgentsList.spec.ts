import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAvailableAgentsList } from './useAvailableAgentsList';
import { createFakeAgent } from '../../../../tests/mocks/data';

const formatAgentItem = (agent: Serialized<ILivechatAgent>) => ({
	_id: agent._id,
	label: agent.username ?? '',
	value: agent._id,
});

const mockGetAvailableAgents = jest.fn();

const appRoot = new MockedAppRootBuilder().withEndpoint('GET', '/v1/omnichannel/agents/available', mockGetAvailableAgents);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch available agents', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeAgent());

	mockGetAvailableAgents.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const agents = data.slice(offset, offset + count);

		return {
			agents,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useAvailableAgentsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatAgentItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatAgentItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetAvailableAgents).toHaveBeenCalledTimes(2);
});
