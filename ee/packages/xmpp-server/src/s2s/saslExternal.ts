import type tls from 'node:tls';
import { checkServerIdentity } from 'node:tls';

import { normalizeDomain } from '../jid/normalize';

/**
 * SASL EXTERNAL peer verification: the socket-level chain must be trusted
 * (`socket.authorized`) and the certificate identity must match the claimed
 * domain (dNSName SANs including wildcards, via Node's hostname matcher).
 * XmppAddr/SRVName otherName entries are not evaluated — dNSName covers the
 * certificates issued by public CAs in practice.
 */
export function verifyPeerCertForDomain(socket: tls.TLSSocket, domain: string): boolean {
	if (!socket.authorized) {
		return false;
	}

	const cert = socket.getPeerCertificate(false);
	if (!cert || Object.keys(cert).length === 0) {
		return false;
	}

	try {
		return checkServerIdentity(normalizeDomain(domain), cert) === undefined;
	} catch {
		return false;
	}
}
