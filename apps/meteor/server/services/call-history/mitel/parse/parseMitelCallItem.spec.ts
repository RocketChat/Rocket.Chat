import { parseMitelCallItem } from './parseMitelCallItem';
import { calls } from './test-data';

jest.mock('../../logger', () => ({
	logger: {
		log: () => null,
		warn: () => null,
		error: () => null,
	},
}));

describe('parseMitelCallItem', () => {
	it.each(calls)('should parse $name', ({ raw, parsed }) => {
		expect(parseMitelCallItem(raw)).toStrictEqual(parsed);
	});
});
