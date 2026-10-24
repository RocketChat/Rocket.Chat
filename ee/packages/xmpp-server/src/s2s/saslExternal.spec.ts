import type tls from 'node:tls';

import { verifyPeerCertForDomain } from './saslExternal';

function createSocket(
	subjectaltname: string,
	authorized = true,
	subject: Record<string, string> = { CN: 'wrong.example.com' },
): tls.TLSSocket {
	const cert = {
		subject,
		subjectaltname,
	};

	return {
		authorized,
		getPeerCertificate: () => cert,
	} as unknown as tls.TLSSocket;
}

describe('verifyPeerCertForDomain', () => {
	it('rejects an unauthorized socket', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:a.localhost', false), 'a.localhost')).toBe(false);
	});

	it('rejects a certificate with no SAN identities', () => {
		expect(verifyPeerCertForDomain(createSocket(''), 'a.localhost')).toBe(false);
	});

	it('rejects a CN-only certificate', () => {
		expect(verifyPeerCertForDomain(createSocket('', true, { CN: 'a.localhost' }), 'a.localhost')).toBe(false);
	});

	it('accepts a matching DNS SAN', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched DNS SAN even if the CN matches', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:b.localhost', true, { CN: 'a.localhost' }), 'a.localhost')).toBe(false);
	});

	it('accepts a matching wildcard DNS SAN', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'chat.example.com')).toBe(true);
	});

	it('rejects a wildcard DNS SAN for the bare domain', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'example.com')).toBe(false);
	});

	it('rejects a wildcard DNS SAN for a multi-label subdomain', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'a.b.example.com')).toBe(false);
	});

	it('rejects an IP SAN when the domain is an IP literal and the DNS SAN does not match', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:wrong.example.com, IP Address:127.0.0.1'), '127.0.0.1')).toBe(false);
	});

	it('accepts a matching SRVName identity', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:SRVName:_xmpp-server.a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched SRVName identity', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:SRVName:_xmpp-server.b.localhost'), 'a.localhost')).toBe(false);
	});

	it('accepts a matching SRVName despite a mismatched DNS SAN', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:b.localhost, othername:SRVName:_xmpp-server.a.localhost'), 'a.localhost')).toBe(true);
	});

	it('accepts a matching XmppAddr identity', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched XmppAddr identity', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:b.localhost'), 'a.localhost')).toBe(false);
	});

	it('accepts a valid XmppAddr after a malformed identity', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:invalid domain, othername:XmppAddr:a.localhost'), 'a.localhost')).toBe(
			true,
		);
	});
});
