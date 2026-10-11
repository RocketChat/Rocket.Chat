import {
	buildAppliedFilterChips,
	buildFilterSuggestions,
	buildRoomSearchQuery,
	buildUserFilterSuggestions,
	emptySearchFilters,
	extractCompletedSearchFilters,
	getAISearchButtonTooltip,
	getFilterSearchState,
	mergeSearchFilters,
	parseSearchFilterText,
	serializeSearchQuery,
} from './clientSearch';

describe('AI Search client helpers', () => {
	describe('parseSearchFilterText', () => {
		it('extracts room, user, and date filters while preserving the free-text query', () => {
			expect(parseSearchFilterText('in:general,dev from:@alice after:2026-01-01 before:2026-01-31 fruit colors')).toEqual({
				searchText: 'fruit colors',
				filters: {
					roomNames: ['general', 'dev'],
					rids: [],
					fromUsernames: ['alice'],
					startDate: '2026-01-01',
					endDate: '2026-01-31',
				},
			});
		});

		it('supports quoted filter values with spaces', () => {
			expect(parseSearchFilterText('mongo in:"team room" from:"rocket user"')).toEqual({
				searchText: 'mongo',
				filters: {
					roomNames: ['team room'],
					rids: [],
					fromUsernames: ['rocket user'],
				},
			});
		});
	});

	describe('extractCompletedSearchFilters', () => {
		it('keeps a single active trailing filter token editable', () => {
			expect(extractCompletedSearchFilters('mongo from:ren')).toEqual({
				searchText: 'mongo from:ren',
				filters: emptySearchFilters(),
				hasCompletedFilters: false,
			});
		});

		it('extracts completed filters when the token is followed by whitespace', () => {
			expect(extractCompletedSearchFilters('mongo from:ren ')).toEqual({
				searchText: 'mongo ',
				filters: {
					roomNames: [],
					rids: [],
					fromUsernames: ['ren'],
				},
				hasCompletedFilters: true,
			});
		});

		it('extracts multiple completed filters in the same input', () => {
			expect(extractCompletedSearchFilters('in:general from:ren ')).toEqual({
				searchText: '',
				filters: {
					roomNames: ['general'],
					rids: [],
					fromUsernames: ['ren'],
				},
				hasCompletedFilters: true,
			});
		});

		it('keeps the trailing token editable while completing the preceding filters', () => {
			expect(extractCompletedSearchFilters('in:general from:ren')).toEqual({
				searchText: 'from:ren',
				filters: {
					roomNames: ['general'],
					rids: [],
					fromUsernames: [],
				},
				hasCompletedFilters: true,
			});
		});
	});

	describe('mergeSearchFilters', () => {
		it('deduplicates repeated rooms and users while preserving latest date filters', () => {
			expect(
				mergeSearchFilters(
					{ roomNames: ['general'], rids: ['r1'], fromUsernames: ['alice'], startDate: '2026-01-01' },
					{ roomNames: ['general', 'dev'], rids: ['r1', 'r2'], fromUsernames: ['alice', 'bob'], endDate: '2026-01-31' },
				),
			).toEqual({
				roomNames: ['general', 'dev'],
				rids: ['r1', 'r2'],
				fromUsernames: ['alice', 'bob'],
				startDate: '2026-01-01',
				endDate: '2026-01-31',
			});
		});
	});

	describe('buildAppliedFilterChips', () => {
		it('groups common filter types into a single readable chip', () => {
			const t = (key: string, options?: Record<string, string>): string =>
				({
					Search_filter_in_rooms: `Messages in ${options?.rooms}`,
					Search_filter_from_users: `Messages from ${options?.users}`,
					Search_filter_after_date: `Messages after ${options?.date}`,
					Search_filter_before_date: `Messages before ${options?.date}`,
				})[key] || key;

			expect(
				buildAppliedFilterChips(
					{
						roomNames: ['general', 'dev'],
						rids: [],
						fromUsernames: ['alice', 'bob'],
						startDate: '2026-01-01',
					},
					t,
				),
			).toEqual([
				{ key: 'in', values: ['general', 'dev'], label: '#general, #dev', title: 'Messages in #general, #dev' },
				{ key: 'from', values: ['alice', 'bob'], label: '@alice, @bob', title: 'Messages from @alice, @bob' },
				{ key: 'after', values: ['2026-01-01'], label: 'after:2026-01-01', title: 'Messages after 2026-01-01' },
			]);
		});
	});

	describe('serializeSearchQuery', () => {
		it('quotes filter values with spaces and appends the free-text query', () => {
			expect(
				serializeSearchQuery('fruit colors', {
					roomNames: ['team room'],
					rids: [],
					fromUsernames: ['alice'],
					startDate: '2026-01-01',
				}),
			).toBe('in:"team room" from:alice after:2026-01-01 fruit colors');
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

	describe('filter suggestions', () => {
		const t = (key: string): string => key;

		it('builds room suggestions from an active in filter', () => {
			expect(
				buildFilterSuggestions(
					'deployment in:gen',
					{ key: 'in', value: 'gen', start: 11, end: 17 },
					[{ _id: 'room-id', name: 'general', fname: 'General' }],
					t,
				),
			).toEqual([
				{
					key: 'in-room-id',
					group: 'rooms',
					title: '#General',
					description: 'Search_in_this_room',
					value: 'deployment in:general ',
					icon: 'hash',
				},
			]);
		});

		it('builds user suggestions from an active from filter', () => {
			expect(
				buildUserFilterSuggestions(
					'deployment from:ali',
					{ key: 'from', value: 'ali', start: 11, end: 19 },
					[{ _id: 'user-id', name: 'Example User', username: 'alice' }],
					t,
				),
			).toEqual([
				{
					key: 'from-user-id',
					group: 'users',
					title: '@alice',
					description: 'Example User',
					value: 'deployment from:alice ',
					icon: 'user',
				},
			]);
		});

		it('does not parse filters while AI Search is inactive', () => {
			expect(getFilterSearchState('deployment in:general', emptySearchFilters(), false)).toEqual({
				searchText: 'deployment in:general',
				filters: emptySearchFilters(),
				activeFilter: undefined,
			});
		});

		it('parses and merges filters while AI Search is active', () => {
			expect(
				getFilterSearchState('deployment in:general from:bob', { roomNames: [], rids: ['room-id'], fromUsernames: ['alice'] }, true),
			).toEqual({
				searchText: 'deployment',
				filters: {
					roomNames: ['general'],
					rids: ['room-id'],
					fromUsernames: ['alice', 'bob'],
				},
				activeFilter: { key: 'from', value: 'bob', start: 22, end: 30 },
			});
		});
	});

	describe('getAISearchButtonTooltip', () => {
		const t = (key: string): string => key;

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
