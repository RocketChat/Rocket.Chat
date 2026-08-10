import dns from 'node:dns/promises';

import { normalizeDomain } from '../jid/normalize';

export type XmppServerAddress = { host: string; port: number };

export type XmppDnsResolver = (domain: string) => Promise<XmppServerAddress[]>;

const DEFAULT_S2S_PORT = 5269;

type SrvRecord = { priority: number; weight: number; name: string; port: number };

/** RFC 2782: ascending priority; weighted random order within each priority group. */
export function orderSrvRecords(records: SrvRecord[], random: () => number = Math.random): SrvRecord[] {
	const byPriority = new Map<number, SrvRecord[]>();
	for (const record of records) {
		const group = byPriority.get(record.priority) ?? [];
		group.push(record);
		byPriority.set(record.priority, group);
	}

	const ordered: SrvRecord[] = [];
	for (const priority of [...byPriority.keys()].sort((a, b) => a - b)) {
		const group = [...(byPriority.get(priority) as SrvRecord[])];
		while (group.length > 0) {
			const totalWeight = group.reduce((sum, r) => sum + r.weight, 0);
			let threshold = random() * (totalWeight + group.length);
			let picked = group.length - 1;
			for (let i = 0; i < group.length; i++) {
				// +1 per record keeps zero-weight records selectable
				threshold -= group[i].weight + 1;
				if (threshold < 0) {
					picked = i;
					break;
				}
			}
			ordered.push(group[picked]);
			group.splice(picked, 1);
		}
	}

	return ordered;
}

/**
 * Resolves the S2S addresses for a remote XMPP domain: `_xmpp-server._tcp` SRV
 * lookup with A/AAAA:5269 fallback. XEP-0368 direct TLS (`_xmpps-server._tcp`)
 * is intentionally not supported.
 */
export const resolveXmppServer: XmppDnsResolver = async (domain: string): Promise<XmppServerAddress[]> => {
	const asciiDomain = normalizeDomain(domain);

	try {
		const records = await dns.resolveSrv(`_xmpp-server._tcp.${asciiDomain}`);
		if (records.length === 1 && records[0].name === '.') {
			throw new Error(`XMPP service explicitly not provided by domain: ${asciiDomain}`);
		}
		if (records.length > 0) {
			return orderSrvRecords(records).map((record) => ({ host: record.name, port: record.port }));
		}
	} catch (error) {
		const { code } = error as NodeJS.ErrnoException;
		if (code !== 'ENOTFOUND' && code !== 'ENODATA') {
			throw error;
		}
	}

	return [{ host: asciiDomain, port: DEFAULT_S2S_PORT }];
};
