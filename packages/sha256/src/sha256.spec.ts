import { SHA256 } from './sha256';

it.each([
	['meteor', '647d177cca8601046a3cb39e12f55bec5790bfcbc42199dd5fcf063200fac1d0'],
	['rocket.chat', '515ea73d42a1c74f96b9016051e47002791cde4cdb856d56be9b53ec45b0f3ad'],
])(`should hash %p as %p`, (input, expected) => {
	expect(SHA256(input)).toEqual(expected);
});
