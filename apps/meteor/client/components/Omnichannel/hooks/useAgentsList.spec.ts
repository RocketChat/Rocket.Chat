import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAgentsList } from './useAgentsList';
import { createFakeAgent } from '../../../../tests/mocks/data';

const formatAgentItem = (agent: Serialized<ILivechatAgent>) => ({
	_id: agent._id,
	label: `${agent.name || agent._id} (@${agent.username})`,
	value: agent._id,
});

const mockGetAgents = jest.fn();

const appRoot = new MockedAppRootBuilder()
	.withTranslations('en', 'core', { All: 'All', Empty_no_agent_selected: 'Empty, no agent selected' })
	.withEndpoint('GET', '/v1/livechat/users/agent', mockGetAgents);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch agents', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeAgent());

	mockGetAgents.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const users = data.slice(offset, offset + count);

		return {
			users,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useAgentsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatAgentItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatAgentItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetAgents).toHaveBeenCalledTimes(2);
});

it('should include "All" item if haveAll is true', async () => {
	mockGetAgents.mockResolvedValueOnce({
		users: Array.from({ length: 5 }, () => createFakeAgent()),
		count: 5,
		offset: 0,
		total: 5,
	});

	const { result } = renderHook(() => useAgentsList({ filter: '', haveAll: true }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data[0].label).toBe('All'));
});

it('should include "Empty_no_agent_selected" item if haveNoAgentsSelectedOption is true', async () => {
	mockGetAgents.mockResolvedValueOnce({
		users: Array.from({ length: 5 }, () => createFakeAgent()),
		count: 5,
		offset: 0,
		total: 5,
	});

	const { result } = renderHook(() => useAgentsList({ filter: '', haveNoAgentsSelectedOption: true }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data[0].label).toBe('Empty, no agent selected'));
});
