import { E164_PHONE_REGEX } from './e164PhoneRegex';

describe('E164_PHONE_REGEX', () => {
	describe('valid numbers', () => {
		it.each([
			['+15551234567', 'with leading plus'],
			['15551234567', 'without leading plus'],
			['+1 555 123 4567', 'with spaces between digit groups'],
			['+1 5 5 5 1 2 3 4 5 6 7', 'with a space before every digit'],
			['+44', 'minimum length (2 digits)'],
			['+123456789012345', 'maximum length (15 digits)'],
			['+1 234 567 890 123 45', 'maximum length with spaces'],
		])('accepts "%s" (%s)', (value) => {
			expect(E164_PHONE_REGEX.test(value)).toBe(true);
		});
	});

	describe('invalid numbers', () => {
		it.each([
			['', 'empty string'],
			['+', 'plus sign only'],
			['+0123456789', 'leading zero after plus'],
			['0123456789', 'leading zero without plus'],
			['+1', 'too short (1 digit)'],
			['+1234567890123456', 'too long (16 digits)'],
			['+1  5551234567', 'double space between digits'],
			['+ 15551234567', 'space right after plus'],
			['+1555123456 ', 'trailing space'],
			[' +15551234567', 'leading space'],
			['+1555-123-4567', 'dashes instead of spaces'],
			['++15551234567', 'multiple plus signs'],
			['+1555abc4567', 'letters mixed in'],
		])('rejects "%s" (%s)', (value) => {
			expect(E164_PHONE_REGEX.test(value)).toBe(false);
		});
	});
});
