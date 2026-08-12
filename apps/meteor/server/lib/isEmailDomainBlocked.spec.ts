import { isEmailDomainBlocked } from './isEmailDomainBlocked';

// `0-mail.com` is present in the built-in default list; `gmail.com` is not.
describe('isEmailDomainBlocked', () => {
	it('blocks a default-listed domain when the default list is enabled, even with an empty custom list', () => {
		// Regression: previously the default list was only consulted when the
		// custom list was non-empty, so on a stock install this returned false.
		expect(isEmailDomainBlocked('0-mail.com', [], true)).toBe(true);
	});

	it('does not block a default-listed domain when the default list is disabled', () => {
		expect(isEmailDomainBlocked('0-mail.com', [], false)).toBe(false);
	});

	it('blocks a domain on the custom list', () => {
		expect(isEmailDomainBlocked('evil.example', ['evil.example'], false)).toBe(true);
	});

	it('does not block a domain that is on neither list', () => {
		expect(isEmailDomainBlocked('gmail.com', ['evil.example'], true)).toBe(false);
	});
});
