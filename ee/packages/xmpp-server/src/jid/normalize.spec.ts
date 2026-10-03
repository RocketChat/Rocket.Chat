import { InvalidJidError } from '../errors';
import { isDomainAllowed, normalizeDomain, normalizeRoomJid, normalizeUserBareJid } from './normalize';

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
