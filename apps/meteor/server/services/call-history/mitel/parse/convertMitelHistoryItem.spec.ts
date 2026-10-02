import { convertMitelHistoryItem } from './convertMitelHistoryItem';
import { validCalls, invalidCalls } from './test-data';

jest.mock('../../logger', () => ({
	logger: {
		log: () => null,
		warn: () => null,
		error: () => null,
	},
}));

describe('convertMitelHistoryItem', () => {
	it.each(validCalls)('should convert $name', ({ parsed, converted }) => {
		expect(convertMitelHistoryItem(parsed, 'user')).toStrictEqual(converted);
	});

	it.each(invalidCalls)('should fail to convert $name', ({ parsed }) => {
		expect(() => convertMitelHistoryItem(parsed, 'user')).toThrow();
	});
});
