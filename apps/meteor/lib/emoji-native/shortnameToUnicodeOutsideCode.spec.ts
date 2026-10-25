import { shortnameToUnicodeOutsideCode } from './shortnameToUnicodeOutsideCode';

describe('shortnameToUnicodeOutsideCode', () => {
	it('should convert shortnames in plain text', () => {
		expect(shortnameToUnicodeOutsideCode('Hello :smile:')).toBe('Hello 😄');
	});

	it('should leave shortnames inside a link as they are', () => {
		expect(shortnameToUnicodeOutsideCode('see https://example.com/:x:/something :smile:')).toBe('see https://example.com/:x:/something 😄');
	});

	it('should leave shortnames inside inline code as they are', () => {
		expect(shortnameToUnicodeOutsideCode('run `:x:` then :smile:')).toBe('run `:x:` then 😄');
	});

	it('should leave shortnames inside a code block as they are', () => {
		expect(shortnameToUnicodeOutsideCode('```\n:x:\n:smile:\n``` :smile:')).toBe('```\n:x:\n:smile:\n``` 😄');
	});

	it('should leave shortnames inside a longer fence that contains a shorter one as they are', () => {
		expect(shortnameToUnicodeOutsideCode('````\n```\n:x:\n```` :smile:')).toBe('````\n```\n:x:\n```` 😄');
	});

	it('should leave shortnames inside a double backtick span that contains a single backtick as they are', () => {
		expect(shortnameToUnicodeOutsideCode('`` a `:x:` `` :smile:')).toBe('`` a `:x:` `` 😄');
	});

	it('should convert shortnames next to an unclosed backtick', () => {
		expect(shortnameToUnicodeOutsideCode('a ` :smile:')).toBe('a ` 😄');
	});
});
