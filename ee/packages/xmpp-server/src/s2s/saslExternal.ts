import type tls from 'node:tls';
import { checkServerIdentity } from 'node:tls';

import { normalizeDomain } from '../jid/normalize';

/**
 * Whether the peer's trusted certificate names `domain`, by dNSName or, without one, by CN.
 *
 * TODO: match SRVName and XmppAddr and refuse the CN, per ADR 0005
 * See ../../docs/adr/0005-peer-certificates-name-a-domain-by-dnsname-srvname-or-xmppaddr.md
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
