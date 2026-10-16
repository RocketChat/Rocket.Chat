import type { XmppDnsResolver, XmppServerAddress } from '@rocket.chat/xmpp-server';

const normalize = (domain: string): string => domain.trim().toLowerCase().replace(/\.$/, '');

/**
 * Parses `domain=host:port,domain=host:port` into a resolver that answers those domains
 * directly and falls back to DNS for everything else. Lets local peers pass dialback.
 */
export function parseDnsOverrides(spec: string | undefined, fallback: XmppDnsResolver): XmppDnsResolver | undefined {
	if (!spec?.trim()) {
		return undefined;
	}

	const overrides = new Map<string, XmppServerAddress>();
	for (const entry of spec.split(',')) {
		const [domain, address] = entry.trim().split('=');
		const separator = address?.lastIndexOf(':') ?? -1;
		const port = Number(address?.slice(separator + 1));
		if (!domain || separator <= 0 || !Number.isInteger(port)) {
			throw new Error(`Invalid XMPP_DNS_OVERRIDES entry: "${entry}" (expected domain=host:port)`);
		}
		overrides.set(normalize(domain), { host: address.slice(0, separator), port });
	}

	return async (domain) => {
		const override = overrides.get(normalize(domain));
		return override ? [override] : fallback(domain);
	};
}
