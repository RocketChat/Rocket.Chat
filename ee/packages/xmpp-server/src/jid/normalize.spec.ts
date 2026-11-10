import { InvalidJidError } from '../errors';
import { isDomainAllowed, normalizeDomain, normalizeRoomJid, normalizeUserBareJid, withDomain } from './normalize';

describe('normalizeUserBareJid', () => {
	it('drops the resource and normalizes the domain only', () => {
		expect(normalizeUserBareJid('Alice@Remote.TLD/phone')).toBe('Alice@remote.tld');
	});

	it('throws for a JID that names no user', () => {
		expect(() => normalizeUserBareJid('remote.tld')).toThrow(InvalidJidError);
		expect(() => normalizeUserBareJid('@remote.tld')).toThrow(InvalidJidError);
		expect(() => normalizeUserBareJid('a@b@remote.tld')).toThrow(InvalidJidError);
		expect(() => normalizeUserBareJid('alice@')).toThrow(InvalidJidError);
	});
});

describe('withDomain', () => {
	it('replaces only the domainpart', () => {
		expect(withDomain('Alice@Remote.TLD./phone/a@b', 'remote.tld')).toBe('Alice@remote.tld/phone/a@b');
		expect(withDomain('Alice@Remote.TLD', 'remote.tld')).toBe('Alice@remote.tld');
		expect(withDomain('Remote.TLD', 'remote.tld')).toBe('remote.tld');
	});
});

describe('normalizeRoomJid', () => {
	it('drops the resource and lowercases the localpart as well as the domain (remote-muc R1)', () => {
		expect(normalizeRoomJid('Team@Conference.Remote.TLD/nick')).toBe('team@conference.remote.tld');
		expect(normalizeRoomJid('Café@müller.example')).toBe('café@xn--mller-kva.example');
	});

	it('throws for a JID that names no room', () => {
		expect(() => normalizeRoomJid('conference.remote.tld')).toThrow(InvalidJidError);
		expect(() => normalizeRoomJid('team@')).toThrow(InvalidJidError);
	});
});

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
		expect(() => normalizeDomain('example .com')).toThrow(InvalidJidError);
	});

	it.each(['remote..tld', 'remote.tld..', '.remote.tld', '.', 'remote。。tld'])('throws on the empty label in %s (R4)', (domain) => {
		expect(() => normalizeDomain(domain)).toThrow(InvalidJidError);
	});

	it.each(['good.com/evil.net', 'good.com?x', 'good.com#x', 'good.com\\x', 'go\tod.com', 'good.com\nx', 'good%2Ecom'])(
		'throws on %j instead of reading it as a URL host (R4)',
		(domain) => {
			expect(() => normalizeDomain(domain)).toThrow(InvalidJidError);
		},
	);

	it('strips a trailing ideographic full stop as it does an ASCII dot (R4)', () => {
		expect(normalizeDomain('example.com。')).toBe('example.com');
	});

	it.each(['  Example.COM ', 'example.com.', 'müller.example', 'example.com。'])(
		'changes nothing when %s is normalized twice (R4)',
		(domain) => {
			expect(normalizeDomain(normalizeDomain(domain))).toBe(normalizeDomain(domain));
		},
	);
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

	it.each(['evil.tld...', 'evil.tld。。'])('never lets %s past a deny list naming evil.tld (R5)', (domain) => {
		expect(() => isDomainAllowed(domain, undefined, ['evil.tld'])).toThrow(InvalidJidError);
	});
});
