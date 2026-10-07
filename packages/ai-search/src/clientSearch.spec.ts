import type { AppliedFilter, SearchFilterKey, SearchFilterMeta } from './clientSearch';
import {
	buildFilterSuggestions,
	buildRoomSearchQuery,
	buildUserFilterSuggestions,
	createAppliedFilter,
	getAISearchButtonTooltip,
	isSearchFilterKey,
	mergeAppliedFilters,
	mergeFilterSuggestions,
	parseSearchInput,
	removeAppliedFilter,
	removeDraftFilter,
	serializeSearchQuery,
	toAISearchParams,
} from './clientSearch';
import { AI_SEARCH_FILTER_SUGGESTION_LIMIT, MAX_SEARCH_FILTER_VALUES } from './constants';

const appliedFilter = (key: SearchFilterKey, value: string, meta?: SearchFilterMeta): AppliedFilter => {
	const filter = createAppliedFilter(key, value, meta);

	if (!filter) {
		throw new Error(`Expected "${value}" to be a valid ${key} filter value`);
	}

	return filter;
};

const t = (key: string): string => key;

describe('AI Search client helpers', () => {
	describe('isSearchFilterKey', () => {
		it('accepts the supported filter keys only', () => {
			expect(['in', 'from', 'after', 'before'].every(isSearchFilterKey)).toBe(true);
			expect(isSearchFilterKey('on')).toBe(false);
		});
	});

	describe('createAppliedFilter', () => {
		it('strips the room and user sigils and derives a case-insensitive id', () => {
			expect(createAppliedFilter('in', '#General')).toEqual({ id: 'in:general', key: 'in', value: 'General' });
			expect(createAppliedFilter('from', '@alice')).toEqual({ id: 'from:alice', key: 'from', value: 'alice' });
		});

		it('keeps the resolved room id when one is provided', () => {
			expect(createAppliedFilter('in', 'general', { rid: 'room-id' })).toEqual({
				id: 'in:general',
				key: 'in',
				value: 'general',
				meta: { rid: 'room-id' },
			});
		});

		it('rejects empty names and dates that are not YYYY-MM-DD', () => {
			expect(createAppliedFilter('from', '@')).toBeUndefined();
			expect(createAppliedFilter('in', '   ')).toBeUndefined();
			expect(createAppliedFilter('after', '2026-1-1')).toBeUndefined();
			expect(createAppliedFilter('before', 'yesterday')).toBeUndefined();
		});
	});

	describe('parseSearchInput', () => {
		it('extracts room, user, and date filters while preserving the free-text query', () => {
			expect(parseSearchInput('in:general,dev from:@alice after:2026-01-01 before:2026-01-31 fruit colors')).toEqual({
				text: 'fruit colors',
				filters: [
					appliedFilter('in', 'general'),
					appliedFilter('in', 'dev'),
					appliedFilter('from', 'alice'),
					appliedFilter('after', '2026-01-01'),
					appliedFilter('before', '2026-01-31'),
				],
			});
		});

		it('supports quoted filter values with spaces and does not split them on commas', () => {
			expect(parseSearchInput('mongo in:"team room" from:"rocket user" in:"a,b"')).toEqual({
				text: 'mongo',
				filters: [appliedFilter('in', 'team room'), appliedFilter('from', 'rocket user'), appliedFilter('in', 'a,b')],
			});
		});

		it('matches filter keys case-insensitively', () => {
			expect(parseSearchInput('IN:general From:alice')).toEqual({
				text: '',
				filters: [appliedFilter('in', 'general'), appliedFilter('from', 'alice')],
			});
		});

		it('leaves tokens with invalid values in the free text', () => {
			expect(parseSearchInput('notes after:2026-13 in:')).toEqual({ text: 'notes after:2026-13 in:', filters: [] });
		});

		it('deduplicates repeated rooms and keeps the latest value of a single-value filter', () => {
			expect(parseSearchInput('in:general in:GENERAL after:2026-01-01 after:2026-02-01')).toEqual({
				text: '',
				filters: [appliedFilter('in', 'general'), appliedFilter('after', '2026-02-01')],
			});
		});

		describe('with keepDraft', () => {
			it('keeps a trailing token that is still being typed as an editable draft', () => {
				expect(parseSearchInput('mongo from:ren', { keepDraft: true })).toEqual({
					text: 'mongo from:ren',
					filters: [],
					draft: { key: 'from', value: 'ren' },
				});
			});

			it('treats a bare trailing key as an empty draft', () => {
				expect(parseSearchInput('mongo in:', { keepDraft: true })).toEqual({
					text: 'mongo in:',
					filters: [],
					draft: { key: 'in', value: '' },
				});
			});

			it('completes the trailing token once it is followed by whitespace', () => {
				expect(parseSearchInput('mongo from:ren ', { keepDraft: true })).toEqual({
					text: 'mongo ',
					filters: [appliedFilter('from', 'ren')],
				});
			});

			it('completes the preceding filters while keeping the trailing one as a draft', () => {
				expect(parseSearchInput('in:general from:ren', { keepDraft: true })).toEqual({
					text: 'from:ren',
					filters: [appliedFilter('in', 'general')],
					draft: { key: 'from', value: 'ren' },
				});
			});

			it('completes a filter typed before the end of the input', () => {
				expect(parseSearchInput('in:general mongo', { keepDraft: true })).toEqual({
					text: 'mongo',
					filters: [appliedFilter('in', 'general')],
				});
			});
		});
	});

	describe('removeDraftFilter', () => {
		it('drops the trailing filter token and keeps the rest of the text', () => {
			expect(removeDraftFilter('deployment in:gen')).toBe('deployment');
			expect(removeDraftFilter('deployment from:')).toBe('deployment');
		});

		it('leaves text without a trailing filter token untouched', () => {
			expect(removeDraftFilter('deployment errors')).toBe('deployment errors');
		});
	});

	describe('mergeAppliedFilters', () => {
		it('appends new room and user filters and ignores duplicates', () => {
			const current = [appliedFilter('in', 'general')];

			expect(mergeAppliedFilters(current, [appliedFilter('in', 'General'), appliedFilter('from', 'alice')])).toEqual([
				appliedFilter('in', 'general'),
				appliedFilter('from', 'alice'),
			]);
		});

		it('replaces a single-value date filter in place', () => {
			const current = [appliedFilter('after', '2026-01-01'), appliedFilter('in', 'general')];

			expect(mergeAppliedFilters(current, [appliedFilter('after', '2026-02-01')])).toEqual([
				appliedFilter('after', '2026-02-01'),
				appliedFilter('in', 'general'),
			]);
		});

		it('upgrades a typed room filter to the suggestion that carries the room id', () => {
			const current = [appliedFilter('in', 'general')];

			expect(mergeAppliedFilters(current, [appliedFilter('in', 'general', { rid: 'room-id' })])).toEqual([
				appliedFilter('in', 'general', { rid: 'room-id' }),
			]);
		});

		it('keeps the room id when the same room is typed again', () => {
			const current = [appliedFilter('in', 'general', { rid: 'room-id' })];

			expect(mergeAppliedFilters(current, [appliedFilter('in', 'general')])).toBe(current);
		});

		it('stops adding room and user filters once the limit is reached', () => {
			const current = Array.from({ length: MAX_SEARCH_FILTER_VALUES }, (_, index) => appliedFilter('from', `user${index}`));

			expect(mergeAppliedFilters(current, [appliedFilter('from', 'one-too-many')])).toHaveLength(MAX_SEARCH_FILTER_VALUES);
		});
	});

	describe('removeAppliedFilter', () => {
		it('removes the filter with the given id', () => {
			const filters = [appliedFilter('in', 'general'), appliedFilter('from', 'alice')];

			expect(removeAppliedFilter(filters, 'in:general')).toEqual([appliedFilter('from', 'alice')]);
		});
	});

	describe('serializeSearchQuery', () => {
		it('quotes filter values with spaces and appends the free-text query', () => {
			expect(
				serializeSearchQuery({
					text: 'fruit colors',
					filters: [appliedFilter('in', 'team room'), appliedFilter('from', 'alice'), appliedFilter('after', '2026-01-01')],
				}),
			).toBe('in:"team room" from:alice after:2026-01-01 fruit colors');
		});

		it('round-trips through parseSearchInput', () => {
			const query = {
				text: 'fruit colors',
				filters: [appliedFilter('in', 'team room'), appliedFilter('in', 'a,b'), appliedFilter('before', '2026-01-31')],
			};

			expect(parseSearchInput(serializeSearchQuery(query))).toEqual(query);
		});
	});

	describe('toAISearchParams', () => {
		it('sends suggested rooms by id, typed rooms by name, and the remaining filters as request params', () => {
			expect(
				toAISearchParams({
					text: 'deployment',
					filters: [
						appliedFilter('in', 'general', { rid: 'room-id' }),
						appliedFilter('in', 'dev'),
						appliedFilter('from', 'alice'),
						appliedFilter('from', 'bob'),
						appliedFilter('after', '2026-01-01'),
						appliedFilter('before', '2026-01-31'),
					],
				}),
			).toEqual({
				query: 'deployment',
				rids: 'room-id',
				roomNames: 'dev',
				fromUsernames: 'alice,bob',
				startDate: '2026-01-01',
				endDate: '2026-01-31',
			});
		});

		it('sends only the query when there are no filters', () => {
			expect(toAISearchParams({ text: 'deployment', filters: [] })).toEqual({ query: 'deployment' });
		});
	});

	describe('buildRoomSearchQuery', () => {
		it('builds indexed room-name and fname regex predicates and excludes direct rooms for channel mentions', () => {
			expect(buildRoomSearchQuery('gen', '#')).toEqual({
				$or: [{ name: /gen/i }, { fname: /gen/i }],
				t: { $ne: 'd' },
			});
		});

		it('bounds the escaped regex pattern used for room lookup', () => {
			const query = buildRoomSearchQuery('/'.repeat(128));
			const firstPredicate = query.$or[0];

			if (!firstPredicate || !('name' in firstPredicate)) {
				throw new Error('Expected the first room lookup predicate to match room names');
			}

			const nameRegex = firstPredicate.name;
			if (!(nameRegex instanceof RegExp)) {
				throw new Error('Expected the room name lookup predicate to use a regex');
			}

			expect(nameRegex.source).toBe('\\/'.repeat(64));
		});
	});

	describe('buildFilterSuggestions', () => {
		it('suggests nothing without a draft', () => {
			expect(buildFilterSuggestions(undefined, [{ _id: 'room-id', name: 'general' }], t)).toEqual([]);
		});

		it('suggests rooms for an in: draft, resolving the room id from the subscription', () => {
			expect(
				buildFilterSuggestions(
					{ key: 'in', value: 'gen' },
					[{ _id: 'subscription-id', rid: 'room-id', name: 'general', fname: 'General' }],
					t,
				),
			).toEqual([
				{
					key: 'in-room-id',
					filterKey: 'in',
					group: 'rooms',
					title: 'General',
					description: 'Search_in_this_room',
					value: 'general',
					icon: 'hash',
					meta: { rid: 'room-id' },
				},
			]);
		});

		it('caps room suggestions at the configured limit', () => {
			const rooms = Array.from({ length: AI_SEARCH_FILTER_SUGGESTION_LIMIT + 3 }, (_, index) => ({
				_id: `room-${index}`,
				name: `room${index}`,
			}));

			expect(buildFilterSuggestions({ key: 'in', value: '' }, rooms, t)).toHaveLength(AI_SEARCH_FILTER_SUGGESTION_LIMIT);
		});

		it('suggests the typed username for a from: draft', () => {
			expect(buildFilterSuggestions({ key: 'from', value: '@ali' }, [], t)).toEqual([
				{
					key: 'from-current',
					filterKey: 'from',
					group: 'users',
					title: 'from:ali',
					description: 'Search_messages_from_this_username',
					value: 'ali',
					icon: 'user',
				},
			]);
		});

		it('shows a placeholder username while the from: draft is empty', () => {
			expect(buildFilterSuggestions({ key: 'from', value: '' }, [], t)).toMatchObject([{ title: 'from:username', value: '' }]);
		});

		describe('date drafts', () => {
			beforeEach(() => {
				jest.useFakeTimers().setSystemTime(new Date(2026, 9, 6, 12));
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			it.each(['after', 'before'] as const)('suggests today, yesterday and a week ago for a %s: draft', (key) => {
				expect(buildFilterSuggestions({ key, value: '' }, [], t)).toEqual(
					[
						['2026-10-06', 'Today'],
						['2026-10-05', 'Yesterday'],
						['2026-09-29', 'Last_7_days'],
					].map(([value, description]) => ({
						key: `${key}-${value}`,
						filterKey: key,
						group: 'dates',
						title: `${key}:${value}`,
						description,
						value,
						icon: 'calendar',
					})),
				);
			});
		});
	});

	describe('buildUserFilterSuggestions', () => {
		it('builds user suggestions for a from: draft', () => {
			expect(
				buildUserFilterSuggestions({ key: 'from', value: 'ali' }, [{ _id: 'user-id', name: 'Example User', username: 'alice' }], t),
			).toEqual([
				{
					key: 'from-user-id',
					filterKey: 'from',
					group: 'users',
					title: '@alice',
					description: 'Example User',
					value: 'alice',
					icon: 'user',
				},
			]);
		});

		it('falls back to a generic description when the user has no name', () => {
			expect(buildUserFilterSuggestions({ key: 'from', value: 'ali' }, [{ _id: 'user-id', username: 'alice' }], t)).toMatchObject([
				{ description: 'Search_messages_from_this_user' },
			]);
		});

		it('suggests no users for other drafts', () => {
			expect(buildUserFilterSuggestions({ key: 'in', value: 'ali' }, [{ _id: 'user-id', username: 'alice' }], t)).toEqual([]);
		});
	});

	describe('mergeFilterSuggestions', () => {
		it('drops fallback suggestions that point at a value already suggested', () => {
			const users = buildUserFilterSuggestions({ key: 'from', value: 'alice' }, [{ _id: 'user-id', username: 'alice' }], t);
			const typedAlice = buildFilterSuggestions({ key: 'from', value: 'alice' }, [], t);
			const typedAli = buildFilterSuggestions({ key: 'from', value: 'ali' }, [], t);

			expect(mergeFilterSuggestions(users, [...typedAlice, ...typedAli])).toEqual([...users, ...typedAli]);
		});
	});

	describe('getAISearchButtonTooltip', () => {
		it('explains unavailable AI Search when the add-on is missing', () => {
			expect(
				getAISearchButtonTooltip({ hasIntelligentSearchLicense: false, intelligentSearchEnabled: true, aiSearchActive: false, t }),
			).toBe('AI_Search_license_required_tooltip');
		});

		it('explains disabled AI Search when the add-on is available', () => {
			expect(
				getAISearchButtonTooltip({ hasIntelligentSearchLicense: true, intelligentSearchEnabled: false, aiSearchActive: false, t }),
			).toBe('AI_Search_disabled_tooltip');
		});

		it('offers to enable AI Search when it is inactive', () => {
			expect(
				getAISearchButtonTooltip({ hasIntelligentSearchLicense: true, intelligentSearchEnabled: true, aiSearchActive: false, t }),
			).toBe('Enable_AI_Search');
		});

		it('offers to disable AI Search when it is active', () => {
			expect(getAISearchButtonTooltip({ hasIntelligentSearchLicense: true, intelligentSearchEnabled: true, aiSearchActive: true, t })).toBe(
				'Disable_AI_Search',
			);
		});
	});
});
