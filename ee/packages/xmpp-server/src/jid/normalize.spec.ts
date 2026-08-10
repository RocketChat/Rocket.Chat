import { InvalidJidError } from '../errors';
import { isDomainAllowed, normalizeDomain } from './normalize';

describe('normalizeDomain', () => {
	it('lowercases and trims', () => {
		expect(normalizeDomain('  Example.COM ')).toBe('example.com');
	});

	it('strips a trailing dot', () => {
		expect(normalizeDomain('example.com.')).toBe('example.com');
	});

	it('converts IDN to punycode', () => {
		expect(normalizeDomain('müller.example')).toBe('xn--mller-kva.example');
	});

	it('throws on empty and invalid values', () => {
		expect(() => normalizeDomain('')).toThrow(InvalidJidError);
		expect(() => normalizeDomain('   ')).toThrow(InvalidJidError);
	});
});

describe('isDomainAllowed', () => {
	it('allows everything when no lists are set', () => {
		expect(isDomainAllowed('anything.tld')).toBe(true);
	});

	it('applies the allow list case-insensitively', () => {
		expect(isDomainAllowed('Remote.TLD', ['remote.tld'])).toBe(true);
		expect(isDomainAllowed('other.tld', ['remote.tld'])).toBe(false);
	});

	it('deny list wins over allow list', () => {
		expect(isDomainAllowed('remote.tld', ['remote.tld'], ['remote.tld'])).toBe(false);
	});
});
