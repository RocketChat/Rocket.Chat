import { parseMitelJSON } from './parseMitelJSON';

jest.mock('../../logger', () => ({
	logger: {
		log: () => null,
		warn: () => null,
		error: () => null,
	},
}));

function makeJson(callItems: any[]): string {
	return JSON.stringify({ subscriber: 'any', callItems });
}

describe('parseMitelJSON', () => {
	it('should return null for an invalid JSON', () => {
		expect(parseMitelJSON('{invalid')).toBeNull();
	});

	it('should return null for a valid JSON without call history data', () => {
		expect(parseMitelJSON('{}')).toBeNull();
	});

	it('should parse a valid JSON with an empty history', () => {
		expect(parseMitelJSON(makeJson([]))).toStrictEqual([]);
	});

	it('should return a list with the same number of items as the list in the JSON', () => {
		const json = makeJson([{}, {}, {}, {}, {}]);

		expect(parseMitelJSON(json)).toHaveLength(5);
	});

	it('should ignore items that are not objects', () => {
		const json = makeJson([{}, {}, false, true, 15, 'item', '{}', [], {}]);

		expect(parseMitelJSON(json)).toHaveLength(3);
	});
});
