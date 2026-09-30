import fs from 'node:fs';
import path from 'node:path';

import { XMPPServer } from '@rocket.chat/xmpp-server';
import type { Logger, XmppDnsResolver } from '@rocket.chat/xmpp-server';

export type Peer = { domain: string; port: number; server: XMPPServer };

export type PeerOptions = {
	count: number;
	basePort: number;
	rcDomain: string;
	rcMucDomain: string;
	/** Where the service under test listens for S2S. */
	rcAddress: { host: string; port: number };
};

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: (obj: unknown, msg?: string) => console.error('[peer]', msg ?? '', obj),
	child: () => silentLogger,
};

export const peerDomain = (index: number): string => `lt${index}.test`;

// Neither side checks certificate identity (dialback authenticates), so the test fixture serves every peer
const fixturesDir = path.join(path.dirname(require.resolve('@rocket.chat/xmpp-server/package.json')), 'tests', 'fixtures');
const tls = {
	cert: fs.readFileSync(path.join(fixturesDir, 'a.localhost.cert.pem'), 'utf8'),
	key: fs.readFileSync(path.join(fixturesDir, 'a.localhost.key.pem'), 'utf8'),
};

/** The value the service needs in XMPP_DNS_OVERRIDES to dial back to these peers. */
export function dnsOverridesFor(count: number, basePort: number, host = '127.0.0.1'): string {
	return Array.from({ length: count }, (_, i) => `${peerDomain(i)}=${host}:${basePort + i}`).join(',');
}

/**
 * Fake remote XMPP domains, one S2S listener each so the service sees one inbound
 * socket per domain, the way it would with real federated servers.
 */
export async function startPeers({ count, basePort, rcDomain, rcMucDomain, rcAddress }: PeerOptions): Promise<Peer[]> {
	const resolver: XmppDnsResolver = async (domain) => {
		if (domain === rcDomain || domain === rcMucDomain) {
			return [rcAddress];
		}
		throw new Error(`Load-test peers only talk to ${rcDomain}, not ${domain}`);
	};

	const peers: Peer[] = [];
	for (let i = 0; i < count; i++) {
		const domain = peerDomain(i);
		const port = basePort + i;
		const server = new XMPPServer(
			{
				domain,
				port,
				bindAddress: '127.0.0.1',
				// A service with TLS configured refuses dialback on a cleartext stream
				tls,
				requireTls: false,
				// The fixture certificate cannot prove the peer's domain, so authentication must go through dialback
				saslExternalEnabled: false,
				dialbackSecret: `load-test-${domain}`,
				// A reconnect mid-step must not silently drop the stanzas queued behind it
				outboundQueueLimit: 1_000_000,
				logger: silentLogger,
			},
			{ resolver },
		);
		await server.start();
		peers.push({ domain, port, server });
	}
	return peers;
}

export async function stopPeers(peers: Peer[]): Promise<void> {
	await Promise.all(peers.map(({ server }) => server.stop()));
}
