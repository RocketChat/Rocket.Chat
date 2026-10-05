import type { ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useConversationsData } from './useConversationsData';

const subscriptions = [
	{ rid: 'general', name: 'general', fname: 'General', t: 'c' },
	{ rid: 'secret', name: 'secret-group', t: 'p' },
	{ rid: 'dm', name: 'john.doe', fname: 'John Doe', t: 'd' },
] as ISubscription[];

const getSubscriptions = jest.fn(() => ({ update: subscriptions, remove: [] }) as any);

let wrapper: ReturnType<ReturnType<typeof mockAppRoot>['build']>;

beforeEach(() => {
	getSubscriptions.mockClear();
	wrapper = mockAppRoot().withEndpoint('GET', '/v1/subscriptions.get', getSubscriptions).build();
});

it('lists every conversation the user belongs to, direct messages included', async () => {
	const { result } = renderHook(() => useConversationsData({ filter: '' }), { wrapper });

	await waitFor(() =>
		expect(result.current).toEqual([
			{ value: 'general', label: { name: 'General', avatarETag: undefined, type: 'c' } },
			{ value: 'secret', label: { name: 'secret-group', avatarETag: undefined, type: 'p' } },
			{ value: 'dm', label: { name: 'John Doe', avatarETag: undefined, type: 'd' } },
		]),
	);
});

it('matches the filter against the name and the display name, ignoring case', async () => {
	const { result } = renderHook(() => useConversationsData({ filter: 'JOHN' }), { wrapper });

	await waitFor(() => expect(result.current?.map(({ value }) => value)).toEqual(['dm']));
});

it.each([
	[['public'], ['general']],
	[['private'], ['secret']],
	[['im', 'mpim'], ['dm']],
	[
		['public', 'private'],
		['general', 'secret'],
	],
] as const)('lists only the kinds in filter.include %j', async (include, expected) => {
	const { result } = renderHook(() => useConversationsData({ filter: '', include: [...include] }), { wrapper });

	await waitFor(() => expect(result.current?.map(({ value }) => value)).toEqual(expected));
});

it('fetches nothing while disabled', () => {
	const { result } = renderHook(() => useConversationsData({ filter: '', enabled: false }), { wrapper });

	expect(result.current).toEqual([]);
	expect(getSubscriptions).not.toHaveBeenCalled();
});
