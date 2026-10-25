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

	it('should convert shortnames next to an unclosed backtick', () => {
		expect(shortnameToUnicodeOutsideCode('a ` :smile:')).toBe('a ` 😄');
	});
});
