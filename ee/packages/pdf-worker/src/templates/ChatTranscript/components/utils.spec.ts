import { messageLongerThanPage, splitByTens, isSystemMessage, markupEntriesGreaterThan10 } from './utils';

describe('utils', () => {
	it('should return true if message is longer than MAX_MSG_SIZE', () => {
		const message = 'f'.repeat(10000);
		expect(messageLongerThanPage(message)).toBe(true);
	});
	it('should return false if message is shorter than MAX_MSG_SIZE', () => {
		const message = 'f'.repeat(1000);
		expect(messageLongerThanPage(message)).toBe(false);
	});
	it('should return false if message is exactly MAX_MSG_SIZE', () => {
		const message = 'f'.repeat(1200);
		expect(messageLongerThanPage(message)).toBe(false);
	});
	it('should return true if message has more markdown elements than MAX_MD_ELEMENTS_PER_VIEW', () => {
		const message = Array(11).fill({});
		expect(markupEntriesGreaterThan10(message)).toBe(true);
	});
	it('should return false if message has less markdown elements than MAX_MD_ELEMENTS_PER_VIEW', () => {
		const message = Array(10).fill({});
		expect(markupEntriesGreaterThan10(message)).toBe(false);
	});
	it('should return false if message has exactly MAX_MD_ELEMENTS_PER_VIEW markdown elements', () => {
		const message = Array(10).fill({});
		expect(markupEntriesGreaterThan10(message)).toBe(false);
	});
	it('should split an array by groups of 10', () => {
		const message = Array(11).fill({});
		expect(splitByTens(message)).toEqual([Array(10).fill({}), Array(1).fill({})]);
	});
	it('should split an array by groups of 10', () => {
		const message = Array(21).fill({});
		expect(splitByTens(message)).toEqual([Array(10).fill({}), Array(10).fill({}), Array(1).fill({})]);
	});
	it('should split an array by groups of 10', () => {
		const message = Array(8).fill({});
		expect(splitByTens(message)).toEqual([Array(8).fill({})]);
	});
	it('should return true if message is a system message', () => {
		const message = { t: 'system' };
		expect(isSystemMessage(message as any)).toBe(true);
	});
	it('should return false if message is not a system message', () => {
		const message = { msg: 'text' };
		expect(isSystemMessage(message as any)).toBe(false);
	});
});
