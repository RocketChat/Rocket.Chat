import type tls from 'node:tls';
import { checkServerIdentity } from 'node:tls';

import { normalizeDomain } from '../jid/normalize';

/**
 * Whether the peer's trusted certificate names `domain` using a DNS SAN,
 * SRVName, or XmppAddr identity. Common Name (CN) is never accepted.
 */
export function verifyPeerCertForDomain(socket: tls.TLSSocket, domain: string): boolean {
	if (!socket.authorized) {
		return false;
	}

	const cert = socket.getPeerCertificate(false);
	if (!cert || Object.keys(cert).length === 0 || !cert.subjectaltname) {
		return false;
	}

	try {
		const normalizedDomain = normalizeDomain(domain);
		const subjectAltName = cert.subjectaltname;

		// Only DNS SAN entries may be used for hostname verification.
		const dnsSubjectAltNames = [...subjectAltName.matchAll(/(?:^|,\s*)DNS:([^,]+)/gi)].map(([, value]) => `DNS:${value.trim()}`);

		if (dnsSubjectAltNames.length > 0) {
			if (
				checkServerIdentity(normalizedDomain, {
					...cert,
					subjectaltname: dnsSubjectAltNames.join(', '),
					subject: {},
				}) === undefined
			) {
				return true;
			}
		}

		// RFC 6120: the SRVName must identify the XMPP server service.
		const srvNames = subjectAltName.matchAll(/(?:^|,\s*)othername:SRVName:([^,]+)/gi);

		for (const [, value] of srvNames) {
			const srvName = value.trim().replace(/\.$/, '').toLowerCase();

			if (srvName === `_xmpp-server.${normalizedDomain}`) {
				return true;
			}
		}

		// XmppAddr must identify the expected domain exactly.
		const xmppAddresses = subjectAltName.matchAll(/(?:^|,\s*)othername:XmppAddr:([^,]+)/gi);

		for (const [, value] of xmppAddresses) {
			try {
				if (normalizeDomain(value.trim()) === normalizedDomain) {
					return true;
				}
			} catch {
				// Ignore malformed identities and check the remaining SANs.
			}
		}

		return false;
	} catch {
		return false;
	}
}
