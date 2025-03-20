import { sortAppsByClosestOrFarthestModificationDate } from './sortAppsByClosestOrFarthestModificationDate';

describe('sortAppsByClosestOrFarthestModificationDate', () => {
	it('should return a positive number if firstDate is before secondDate', () => {
		const firstDate = '2000-04-01T07:00:00';
		const secondDate = '2022-02-21T13:00:00';

		const result = sortAppsByClosestOrFarthestModificationDate(firstDate, secondDate);

		expect(result).toBeGreaterThan(0);
	});

	it('should return a negative number if firstDate is after secondDate', () => {
		const firstDate = '2022-02-21T13:00:00';
		const secondDate = '2000-04-01T07:00:00';

		const result = sortAppsByClosestOrFarthestModificationDate(firstDate, secondDate);

		expect(result).toBeLessThan(0);
	});

	it.skip('should return zero if firstDate and secondDate are equivalent', () => {
		const firstDate = '2000-04-01T07:00:00';
		const secondDate = '2000-04-01T07:00:00';

		const result = sortAppsByClosestOrFarthestModificationDate(firstDate, secondDate);

		expect(result).toBeLessThan(0);
	});
});
