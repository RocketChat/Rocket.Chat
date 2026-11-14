import type tls from 'node:tls';

import { verifyPeerCertForDomain } from './saslExternal';

/**
 * Creates a mock TLS socket with the supplied certificate identity data.
 */
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
	it('rejects an unauthorized socket (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:a.localhost', false), 'a.localhost')).toBe(false);
	});

	it('rejects a certificate with no SAN identities (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket(''), 'a.localhost')).toBe(false);
	});

	it('rejects a CN-only certificate (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('', true, { CN: 'a.localhost' }), 'a.localhost')).toBe(false);
	});

	it('accepts a matching DNS SAN (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched DNS SAN even if the CN matches (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:b.localhost', true, { CN: 'a.localhost' }), 'a.localhost')).toBe(false);
	});

	it('accepts a matching wildcard DNS SAN (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'chat.example.com')).toBe(true);
	});

	it('rejects a wildcard DNS SAN for the bare domain (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'example.com')).toBe(false);
	});

	it('rejects a wildcard DNS SAN for a multi-label subdomain (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:*.example.com'), 'a.b.example.com')).toBe(false);
	});

	it('rejects an IP SAN when the domain is an IP literal and the DNS SAN does not match (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:wrong.example.com, IP Address:127.0.0.1'), '127.0.0.1')).toBe(false);
	});

	it('accepts a matching SRVName identity (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:SRVName:_xmpp-server.a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched SRVName identity (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:SRVName:_xmpp-server.b.localhost'), 'a.localhost')).toBe(false);
	});

	it('accepts a matching SRVName despite a mismatched DNS SAN (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('DNS:b.localhost, othername:SRVName:_xmpp-server.a.localhost'), 'a.localhost')).toBe(true);
	});

	it('accepts a matching XmppAddr identity (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:a.localhost'), 'a.localhost')).toBe(true);
	});

	it('rejects a mismatched XmppAddr identity (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:b.localhost'), 'a.localhost')).toBe(false);
	});

	it('accepts a valid XmppAddr after a malformed identity (R4)', () => {
		expect(verifyPeerCertForDomain(createSocket('othername:XmppAddr:invalid domain, othername:XmppAddr:a.localhost'), 'a.localhost')).toBe(
			true,
		);
	});
});
