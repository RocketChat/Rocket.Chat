import { compileSort } from './sort';

describe('compileSort', () => {
	describe('object specification format', () => {
		it('should sort by a single field ascending', () => {
			const sorter = compileSort({ name: 1 });

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBeLessThan(0);
			expect(sorter(b, a)).toBeGreaterThan(0);
			expect(sorter(a, a)).toBe(0);
		});

		it('should sort by a single field descending', () => {
			const sorter = compileSort({ name: -1 });

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBeGreaterThan(0);
			expect(sorter(b, a)).toBeLessThan(0);
			expect(sorter(a, a)).toBe(0);
		});

		it('should handle multiple fields with different directions', () => {
			const sorter = compileSort({ age: 1, name: -1 });

			const a = { age: 30, name: 'Alice' };
			const b = { age: 30, name: 'Bob' };
			const c = { age: 25, name: 'Charlie' };

			expect(sorter(a, b)).toBeGreaterThan(0); // Same age, name is used (desc)
			expect(sorter(a, c)).toBeGreaterThan(0); // Different age
			expect(sorter(c, b)).toBeLessThan(0); // Different age
		});

		it('should handle when the first field has equal values', () => {
			const sorter = compileSort({ age: 1, name: 1 });

			const a = { age: 30, name: 'Alice' };
			const b = { age: 30, name: 'Bob' };

			expect(sorter(a, b)).toBeLessThan(0); // Same age, name is used (asc)
		});

		it('should handle missing fields', () => {
			const sorter = compileSort({ age: 1 });

			const a = { age: 30 };
			const b = {}; // Missing age

			expect(sorter(a, b)).toBeGreaterThan(0); // undefined is considered smaller
			expect(sorter(b, a)).toBeLessThan(0);
		});

		it('should sort numbers correctly', () => {
			const sorter = compileSort({ score: 1 });

			const a = { score: 100 };
			const b = { score: 50 };

			expect(sorter(a, b)).toBeGreaterThan(0);
			expect(sorter(b, a)).toBeLessThan(0);
		});

		it('should handle nested fields', () => {
			const sorter = compileSort({ 'user.age': 1 });

			const a = { user: { age: 30 } };
			const b = { user: { age: 25 } };

			expect(sorter(a, b)).toBeGreaterThan(0);
			expect(sorter(b, a)).toBeLessThan(0);
		});
	});

	describe('array specification format', () => {
		it('should sort using string array format', () => {
			const sorter = compileSort(['name']);

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBeLessThan(0);
			expect(sorter(b, a)).toBeGreaterThan(0);
		});

		it('should sort using field and direction array format', () => {
			const sorter = compileSort([['name', 'desc']]);

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBeGreaterThan(0);
			expect(sorter(b, a)).toBeLessThan(0);
		});

		it('should handle mix of string and array formats', () => {
			const sorter = compileSort(['age', ['name', 'desc']]);

			const a = { age: 30, name: 'Alice' };
			const b = { age: 30, name: 'Bob' };

			expect(sorter(a, b)).toBeGreaterThan(0);
		});

		it('should handle ascending in array format', () => {
			const sorter = compileSort([['name', 'asc']]);

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBeLessThan(0);
		});
	});

	describe('array values handling', () => {
		it('should handle array values by selecting min value for ascending', () => {
			const sorter = compileSort({ scores: 1 });

			const a = { scores: [10, 20, 30] };
			const b = { scores: [5, 15, 25] };

			expect(sorter(a, b)).toBe(5);
		});

		it('should handle array values by selecting max value for descending', () => {
			const sorter = compileSort({ scores: -1 });

			const a = { scores: [10, 20, 30] };
			const b = { scores: [5, 15, 25] };

			expect(sorter(a, b)).toBe(-5);
		});

		it('should handle empty arrays', () => {
			const sorter = compileSort({ scores: 1 });

			const a = { scores: [] };
			const b = { scores: [5] };

			expect(sorter(a, b)).toBeLessThan(0); // undefined vs 5
		});

		it('should handle nested arrays', () => {
			const sorter = compileSort({ 'users.scores': 1 });

			const a = { users: [{ scores: [10, 5] }, { scores: [20, 15] }] };
			const b = { users: [{ scores: [8, 3] }, { scores: [18, 13] }] };

			expect(sorter(a, b)).toBeGreaterThan(0); // Should compare minimums
		});
	});

	describe('edge cases', () => {
		it('should handle empty sort specification', () => {
			const sorter = compileSort({});

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBe(0); // No sort criteria so all docs equal
		});

		it('should handle empty array sort specification', () => {
			const sorter = compileSort([]);

			const a = { name: 'Alice' };
			const b = { name: 'Bob' };

			expect(sorter(a, b)).toBe(0); // No sort criteria so all docs equal
		});

		it('should sort by multiple fields when first fields are equal', () => {
			const sorter = compileSort({ lastName: 1, firstName: 1 });

			const a = { lastName: 'Smith', firstName: 'Alice' };
			const b = { lastName: 'Smith', firstName: 'Bob' };
			const c = { lastName: 'Jones', firstName: 'Charlie' };

			expect(sorter(a, b)).toBeLessThan(0); // Same last name, different first name
			expect(sorter(a, c)).toBeGreaterThan(0); // Different last names
		});

		it('should handle objects and scalars in the same comparison', () => {
			const sorter = compileSort({ data: 1 });

			const a = { data: { value: 10 } };
			const b = { data: 5 };

			// This tests that the BSON comparison works correctly for different types
			expect(typeof sorter(a, b)).toBe('number'); // Should return a number without error
		});

		it('should handle null and undefined values', () => {
			const sorter = compileSort({ value: 1 });

			const a = { value: null };
			const b = {};
			const c = { value: 0 };

			expect(sorter(a, c)).toBeLessThan(0); // null is less than 0
			expect(sorter(b, c)).toBeLessThan(0); // undefined is less than 0
			expect(sorter(a, b)).toBeGreaterThan(0); // undefined is less than null
		});
	});
});
