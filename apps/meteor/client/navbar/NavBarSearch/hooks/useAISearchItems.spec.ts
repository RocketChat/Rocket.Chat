import { AI_SEARCH_FILTER_SUGGESTION_LIMIT, AI_SEARCH_PAGE_SIZE, emptySearchFilters } from '@rocket.chat/ai-search';
import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAISearchItems } from './useAISearchItems';
import { createFakeSubscription } from '../../../../tests/mocks/data';

let mockDebounce: (value: unknown) => unknown = (value) => value;

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	...jest.requireActual('@rocket.chat/fuselage-hooks'),
	useDebouncedValue: (value: unknown) => mockDebounce(value),
}));

type AutocompleteUser = {
	_id: string;
	name: string;
	username: string;
	nickname: string;
	status: UserStatus;
	avatarETag: string;
};

const setup = ({
	subscriptions = [],
	intelligent = [],
	users = [],
}: {
	subscriptions?: ReturnType<typeof createFakeSubscription>[];
	intelligent?: AISearchResult[];
	users?: AutocompleteUser[];
} = {}) => {
	const aiSearchHandler = jest.fn(() => ({
		intelligent,
		meta: { intelligentSearchEnabled: true, intelligentSearchConfigured: true, answerGenerationConfigured: true },
	}));
	const usersAutocompleteHandler = jest.fn(() => ({ items: users }));

	const wrapper = mockAppRoot()
		.withTranslations('en', 'core', {
			Search_in_this_room: 'Search in this room',
			Search_messages_from_this_username: 'Search messages from this username',
			Search_messages_from_this_user: 'Search messages from this user',
			Today: 'Today',
			Yesterday: 'Yesterday',
			Last_7_days: 'Last 7 days',
		})
		.withSubscriptions(subscriptions)
		.withEndpoint('GET', '/v1/ai.search', aiSearchHandler)
		.withEndpoint('GET', '/v1/users.autocomplete', usersAutocompleteHandler)
		.build();

	return { wrapper, aiSearchHandler, usersAutocompleteHandler };
};

const formatDate = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

beforeEach(() => {
	mockDebounce = (value) => value;
});

describe('useAISearchItems', () => {
	describe('when AI search is inactive', () => {
		it('passes the filter text through untouched and yields no items', async () => {
			const { wrapper, aiSearchHandler, usersAutocompleteHandler } = setup();
			const { result } = renderHook(
				() => useAISearchItems('in:general deploy', { ...emptySearchFilters(), roomNames: ['support'] }, false),
				{ wrapper },
			);

			await act(async () => undefined);

			expect(result.current.data.searchText).toBe('in:general deploy');
			expect(result.current.data.intelligent).toEqual([]);
			expect(result.current.data.filterSuggestions).toEqual([]);
			expect(result.current.isFetching).toBe(false);
			expect(aiSearchHandler).not.toHaveBeenCalled();
			expect(usersAutocompleteHandler).not.toHaveBeenCalled();
		});

		it('defaults to inactive when only the filter text is provided', async () => {
			const { wrapper, aiSearchHandler } = setup();
			const { result } = renderHook(() => useAISearchItems('deploy'), { wrapper });

			await act(async () => undefined);

			expect(result.current.data.searchText).toBe('deploy');
			expect(aiSearchHandler).not.toHaveBeenCalled();
		});
	});

	describe('intelligent search', () => {
		it('strips inline filter tokens and queries ai.search with the parsed filters', async () => {
			const intelligent = [{ _id: 'msg-1', msgId: 'msg-1', text: 'Deployment failed' }];
			const { wrapper, aiSearchHandler } = setup({ intelligent });
			const { result } = renderHook(
				() => useAISearchItems('in:general from:john after:2026-01-01 before:2026-02-01 deploy failed', emptySearchFilters(), true),
				{ wrapper },
			);

			expect(result.current.data.searchText).toBe('deploy failed');
			expect(result.current.isFetching).toBe(true);

			await waitFor(() => expect(result.current.data.intelligent).toEqual(intelligent));
			expect(result.current.isFetching).toBe(false);
			expect(aiSearchHandler).toHaveBeenCalledTimes(1);
			expect(aiSearchHandler).toHaveBeenCalledWith({
				query: 'deploy failed',
				intelligentCount: AI_SEARCH_PAGE_SIZE,
				roomNames: 'general',
				fromUsernames: 'john',
				startDate: '2026-01-01',
				endDate: '2026-02-01',
			});
		});

		it('merges applied filters with inline filter tokens in the request', async () => {
			const { wrapper, aiSearchHandler } = setup();
			const { result } = renderHook(
				() =>
					useAISearchItems(
						'in:general hello',
						{ ...emptySearchFilters(), roomNames: ['support'], fromUsernames: ['jane'], startDate: '2026-05-01' },
						true,
					),
				{ wrapper },
			);

			await waitFor(() => expect(aiSearchHandler).toHaveBeenCalled());
			expect(aiSearchHandler).toHaveBeenCalledWith({
				query: 'hello',
				intelligentCount: AI_SEARCH_PAGE_SIZE,
				roomNames: 'support,general',
				fromUsernames: 'jane',
				startDate: '2026-05-01',
			});
			await waitFor(() => expect(result.current.isFetching).toBe(false));
		});

		it('does not hit ai.search when only filter tokens are present', async () => {
			const { wrapper, aiSearchHandler } = setup();
			const { result } = renderHook(() => useAISearchItems('in:general ', emptySearchFilters(), true), { wrapper });

			await act(async () => undefined);

			expect(result.current.data.searchText).toBe('');
			expect(result.current.data.intelligent).toEqual([]);
			expect(aiSearchHandler).not.toHaveBeenCalled();
		});

		it('withholds intelligent results while the debounced search text lags behind', async () => {
			mockDebounce = () => 'stale';
			const intelligent = [{ _id: 'msg-1', text: 'Old result' }];
			const { wrapper, aiSearchHandler } = setup({ intelligent });
			const { result } = renderHook(() => useAISearchItems('deploy', emptySearchFilters(), true), { wrapper });

			await waitFor(() => expect(aiSearchHandler).toHaveBeenCalledWith(expect.objectContaining({ query: 'stale' })));
			await waitFor(() => expect(result.current.isFetching).toBe(false));

			expect(result.current.data.intelligent).toEqual([]);
		});
	});

	describe('room filter suggestions', () => {
		it('suggests rooms while an in: token is being typed', async () => {
			const subscriptions = [createFakeSubscription({ rid: 'rid-general', name: 'general', fname: 'General', t: 'c' })];
			const { wrapper, aiSearchHandler } = setup({ subscriptions });
			const { result } = renderHook(() => useAISearchItems('in:gen', emptySearchFilters(), true), { wrapper });

			await act(async () => undefined);

			expect(result.current.data.searchText).toBe('');
			expect(aiSearchHandler).not.toHaveBeenCalled();
			expect(result.current.data.filterSuggestions).toEqual([
				{
					key: 'in-rid-general',
					group: 'rooms',
					title: '#General',
					description: 'Search in this room',
					value: 'in:general ',
					icon: 'hash',
				},
			]);
		});

		it('caps room suggestions at the configured limit', async () => {
			const subscriptions = Array.from({ length: AI_SEARCH_FILTER_SUGGESTION_LIMIT + 2 }, (_, index) =>
				createFakeSubscription({ rid: `rid-${index}`, name: `general-${index}`, t: 'c' }),
			);
			const { wrapper } = setup({ subscriptions });
			const { result } = renderHook(() => useAISearchItems('in:gen', emptySearchFilters(), true), { wrapper });

			await act(async () => undefined);

			expect(result.current.data.filterSuggestions).toHaveLength(AI_SEARCH_FILTER_SUGGESTION_LIMIT);
		});

		it('does not suggest rooms without an active in: token', async () => {
			const subscriptions = [createFakeSubscription({ rid: 'rid-general', name: 'general', t: 'c' })];
			const { wrapper } = setup({ subscriptions });
			const { result } = renderHook(() => useAISearchItems('general stuff', emptySearchFilters(), true), { wrapper });

			await waitFor(() => expect(result.current.isFetching).toBe(false));

			expect(result.current.data.filterSuggestions).toEqual([]);
		});
	});

	describe('user filter suggestions', () => {
		const john: AutocompleteUser = {
			_id: 'user-1',
			name: 'John Doe',
			username: 'john',
			nickname: '',
			status: UserStatus.ONLINE,
			avatarETag: '',
		};

		it('suggests usernames from users.autocomplete while a from: token is active', async () => {
			const { wrapper, usersAutocompleteHandler } = setup({ users: [john] });
			const { result } = renderHook(() => useAISearchItems('from:jo', emptySearchFilters(), true), { wrapper });

			await waitFor(() =>
				expect(result.current.data.filterSuggestions).toEqual([
					{
						key: 'from-user-1',
						group: 'users',
						title: '@john',
						description: 'John Doe',
						value: 'from:john ',
						icon: 'user',
					},
					{
						key: 'from-current',
						group: 'users',
						title: 'from:jo',
						description: 'Search messages from this username',
						value: 'from:jo ',
						icon: 'user',
					},
				]),
			);
			expect(usersAutocompleteHandler).toHaveBeenCalledWith({
				selector: JSON.stringify({ term: 'jo', conditions: {}, exceptions: [] }),
			});
		});

		it('withholds username suggestions while the debounced from: value lags behind', async () => {
			mockDebounce = (value) => (value === 'jo' ? '' : value);
			const { wrapper, usersAutocompleteHandler } = setup({ users: [john] });
			const { result } = renderHook(() => useAISearchItems('from:jo', emptySearchFilters(), true), { wrapper });

			await waitFor(() => expect(usersAutocompleteHandler).toHaveBeenCalled());
			await waitFor(() => expect(result.current.isFetching).toBe(false));

			expect(result.current.data.filterSuggestions).toEqual([
				{
					key: 'from-current',
					group: 'users',
					title: 'from:jo',
					description: 'Search messages from this username',
					value: 'from:jo ',
					icon: 'user',
				},
			]);
		});
	});

	describe('date filter suggestions', () => {
		// freeze the clock so the hook's `new Date()` and the expected values below agree even across midnight
		beforeEach(() => {
			jest.useFakeTimers({ now: new Date('2026-07-15T12:00:00Z'), advanceTimers: true });
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('offers date suggestions for a trailing after: token', async () => {
			const { wrapper } = setup();
			const { result } = renderHook(() => useAISearchItems('after:', emptySearchFilters(), true), { wrapper });

			await waitFor(() => expect(result.current.isFetching).toBe(false));

			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(today.getDate() - 1);
			const lastWeek = new Date(today);
			lastWeek.setDate(today.getDate() - 7);

			expect(result.current.data.filterSuggestions).toEqual([
				{
					key: `after-${formatDate(today)}`,
					group: 'dates',
					title: `after:${formatDate(today)}`,
					description: 'Today',
					value: `after:${formatDate(today)} `,
					icon: 'calendar',
				},
				{
					key: `after-${formatDate(yesterday)}`,
					group: 'dates',
					title: `after:${formatDate(yesterday)}`,
					description: 'Yesterday',
					value: `after:${formatDate(yesterday)} `,
					icon: 'calendar',
				},
				{
					key: `after-${formatDate(lastWeek)}`,
					group: 'dates',
					title: `after:${formatDate(lastWeek)}`,
					description: 'Last 7 days',
					value: `after:${formatDate(lastWeek)} `,
					icon: 'calendar',
				},
			]);
		});

		it('offers date suggestions for a trailing before: token', async () => {
			const { wrapper } = setup();
			const { result } = renderHook(() => useAISearchItems('before:', emptySearchFilters(), true), { wrapper });

			await waitFor(() => expect(result.current.isFetching).toBe(false));

			expect(result.current.data.filterSuggestions).toHaveLength(3);
			expect(result.current.data.filterSuggestions.every(({ key, group }) => key.startsWith('before-') && group === 'dates')).toBe(true);
		});
	});
});
