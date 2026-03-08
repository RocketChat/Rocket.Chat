import fc from 'fast-check';

import { parse } from '../src';

const plainTextArbitrary = fc
	.stringMatching(/[a-zA-Z0-9 ]{1,20}/)
	.filter((value) => value.length > 0);

const timestampArbitrary = fc
	.integer({ min: 1_000_000_000, max: 2_000_000_000 })
	.map((value) => `<t:${value}>`);

const relativeTimestampArbitrary = fc
	.integer({ min: 1_000_000_000, max: 2_000_000_000 })
	.map((value) => `<t:${value}:R>`);

const mentionArbitrary = fc
	.stringMatching(/[a-z0-9._-]{1,12}/)
	.map((value) => `@${value}`);

const boldArbitrary = plainTextArbitrary.map((value) => `*${value}*`);

const strikeArbitrary = fc.oneof(timestampArbitrary, relativeTimestampArbitrary, plainTextArbitrary).map((value) => `~${value}~`);

const inlineCodeArbitrary = plainTextArbitrary.map((value) => `\`${value}\``);

const parserInputArbitrary = fc
	.array(
		fc.oneof(
			plainTextArbitrary,
			timestampArbitrary,
			relativeTimestampArbitrary,
			mentionArbitrary,
			boldArbitrary,
			strikeArbitrary,
			inlineCodeArbitrary,
		),
		{ minLength: 1, maxLength: 8 },
	)
	.map((parts) => parts.join(' '));

describe('parser fuzz tests', () => {
	test('parses valid parser-like inputs without throwing', () => {
		fc.assert(
			fc.property(parserInputArbitrary, (input) => {
				expect(() => parse(input)).not.toThrow();
			}),
			{ numRuns: 300 },
		);
	});

	test('is deterministic for valid parser-like inputs', () => {
		fc.assert(
			fc.property(parserInputArbitrary, (input) => {
				expect(parse(input)).toEqual(parse(input));
			}),
			{ numRuns: 300 },
		);
	});
});