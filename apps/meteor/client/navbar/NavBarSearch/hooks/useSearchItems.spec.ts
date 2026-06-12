import {
	buildAppliedFilterChips,
	buildRoomSearchQuery,
	emptySearchFilters,
	extractCompletedSearchFilters,
	mergeSearchFilters,
	parseSearchFilterText,
	serializeSearchQuery,
} from './useSearchItems';

describe('NavBarSearch AI filter helpers', () => {
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
			expect(extractCompletedSearchFilters('in:general from:ren')).toEqual({
				searchText: '',
				filters: {
					roomNames: ['general'],
					rids: [],
					fromUsernames: ['ren'],
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
			expect(
				buildAppliedFilterChips({
					roomNames: ['general', 'dev'],
					rids: [],
					fromUsernames: ['alice', 'bob'],
					startDate: '2026-01-01',
				}),
			).toEqual([
				{ key: 'in', values: ['general', 'dev'], label: 'in: #general, #dev' },
				{ key: 'from', values: ['alice', 'bob'], label: 'from: @alice, @bob' },
				{ key: 'after', values: ['2026-01-01'], label: 'after:2026-01-01' },
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
});
