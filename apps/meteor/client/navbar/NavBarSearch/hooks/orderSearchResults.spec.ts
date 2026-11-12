import { isExactSearchMatch, orderSearchResults } from './orderSearchResults';

describe('orderSearchResults', () => {
	describe('isExactSearchMatch', () => {
		it('should match exact name case-insensitively and with trimmed whitespace', () => {
			expect(isExactSearchMatch({ name: 'marketing-team' }, 'marketing-team')).toBe(true);
			expect(isExactSearchMatch({ name: 'marketing-team' }, 'Marketing-Team')).toBe(true);
			expect(isExactSearchMatch({ name: 'marketing-team' }, '  marketing-team  ')).toBe(true);
		});

		it('should match fname case-insensitively', () => {
			expect(isExactSearchMatch({ fname: 'Marketing Team' }, 'marketing team')).toBe(true);
			expect(isExactSearchMatch({ fname: 'Marketing Team' }, 'Marketing Team')).toBe(true);
		});

		it('should not match partial names or empty search terms', () => {
			expect(isExactSearchMatch({ name: 'marketing-team-ideas' }, 'marketing-team')).toBe(false);
			expect(isExactSearchMatch({ name: 'marketing-team' }, '')).toBe(false);
			expect(isExactSearchMatch({ name: 'marketing-team' }, '   ')).toBe(false);
		});
	});

	describe('orderSearchResults', () => {
		it('should hoist exact match to the top ahead of other rooms', () => {
			const local = [{ name: 'marketing-team-ideas1' }, { name: 'marketing-team-ideas2' }, { name: 'marketing-team' }];
			const server = [{ name: 'marketing-team-notes' }];

			const result = orderSearchResults(local, server, 'marketing-team');

			expect(result.map((r) => r.name)).toEqual([
				'marketing-team',
				'marketing-team-ideas1',
				'marketing-team-ideas2',
				'marketing-team-notes',
			]);
		});

		it('should hoist exact server match ahead of local partial matches', () => {
			const local = [{ name: 'marketing-team-ideas1' }];
			const server = [{ name: 'marketing-team' }];

			const result = orderSearchResults(local, server, 'marketing-team');

			expect(result.map((r) => r.name)).toEqual(['marketing-team', 'marketing-team-ideas1']);
		});
	});
});
