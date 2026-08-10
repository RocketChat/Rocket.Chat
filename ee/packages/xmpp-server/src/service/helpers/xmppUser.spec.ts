import { domainOfJid, toBareJid } from './jid';

describe('toBareJid', () => {
	it('strips the resource', () => {
		expect(toBareJid('alice@remote.tld/phone')).toBe('alice@remote.tld');
	});

	it('leaves a bare JID unchanged', () => {
		expect(toBareJid('alice@remote.tld')).toBe('alice@remote.tld');
	});
});

describe('domainOfJid', () => {
	it('extracts the domain from a full JID', () => {
		expect(domainOfJid('alice@remote.tld/phone')).toBe('remote.tld');
	});

	it('extracts the domain from a bare JID', () => {
		expect(domainOfJid('bob@conference.remote.tld')).toBe('conference.remote.tld');
	});
});
