import { toSipCallTarget } from './toSipCallTarget';

describe('toSipCallTarget', () => {
	it.each([
		['+49 176 10848201', '+4917610848201'],
		['(040) 123-456', '040123456'],
		['1001', '1001'],
		['*21#', '*21#'],
		['Tel: +49 40 123456', '+4940123456'],
	])('calls %j as a phone number', (id, expected) => {
		expect(toSipCallTarget(id)).toBe(expected);
	});

	it.each([
		['alice', 'alice'],
		['alice2', 'alice2'],
		['front.desk', 'front.desk'],
		[' reception ', 'reception'],
	])('calls the named extension %j as it is', (id, expected) => {
		expect(toSipCallTarget(id)).toBe(expected);
	});

	it.each([[''], ['   '], ['n/a'], ['+']])('has nothing to call for %j', (id) => {
		expect(toSipCallTarget(id)).toBeUndefined();
	});
});
