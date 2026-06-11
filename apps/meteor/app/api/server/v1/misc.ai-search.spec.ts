import { isSearchAnswerProps, isUnifiedSearchProps } from '@rocket.chat/rest-typings';

describe('AI Search REST schemas', () => {
	describe('isUnifiedSearchProps', () => {
		it('accepts AI Search query filters supported by the backend', () => {
			expect(
				isUnifiedSearchProps({
					query: 'fruit colors',
					includeIntelligent: true,
					intelligentCount: 8,
					roomNames: 'general,dev',
					fromUsernames: 'alice,bob',
					startDate: '2026-01-01T00:00:00.000Z',
					endDate: '2026-01-31T00:00:00.000Z',
				}),
			).toBe(true);
		});

		it('rejects empty queries and unsupported filter properties', () => {
			expect(isUnifiedSearchProps({ query: '' })).toBe(false);
			expect(isUnifiedSearchProps({ query: 'fruit colors', unsupported: 'value' })).toBe(false);
		});
	});

	describe('isSearchAnswerProps', () => {
		it('accepts bounded source messages for answer generation', () => {
			expect(
				isSearchAnswerProps({
					query: 'fruit colors',
					messages: [
						{
							_id: 'm1',
							text: 'oranges are green',
							username: 'alice',
							roomName: 'general',
							ts: '2026-01-01T00:00:00.000Z',
							score: 0.61,
						},
					],
				}),
			).toBe(true);
		});

		it('rejects answer requests without source messages', () => {
			expect(isSearchAnswerProps({ query: 'fruit colors', messages: [] })).toBe(false);
		});
	});
});
