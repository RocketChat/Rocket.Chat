import net from 'net';

const domainPattern = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,63}$/;
export const isValidDomain = (domain: string) => domainPattern.test(domain);

export const unwrapBrackets = (s: string) => (s.startsWith('[') && s.endsWith(']') ? s.slice(1, -1) : s);

export const isIpValid = (ip: string): boolean => net.isIP(unwrapBrackets(ip)) !== 0;

const ipv4Ranges = [
	'0.0.0.0/8',
	'10.0.0.0/8',
	'100.64.0.0/10',
	'127.0.0.0/8',
	'169.254.0.0/16',
	'172.16.0.0/12',
	'192.0.0.0/24',
	'192.0.2.0/24',
	'192.88.99.0/24',
	'192.168.0.0/16',
	'198.18.0.0/15',
	'198.51.100.0/24',
	'203.0.113.0/24',
	'224.0.0.0/4',
	'240.0.0.0/4',
	'255.255.255.255',
	'100.100.100.200/32',
];

const ipv6Ranges = [
	'::/128',
	'::1/128',
	'::ffff:0:0/96',
	'3fff::/20',
	'5f00::/16',
	'64:ff9b::/96',
	'64:ff9b:1::/48',
	'100::/64',
	'2001::/32',
	'2001:20::/28',
	'2001:db8::/32',
	'2002::/16',
	'fc00::/7',
	'fe80::/10',
	'ff00::/8',
];

export const isIpInCidrRange = (ip: string, cidr: string): boolean => {
	const [network, prefixStr] = cidr.split('/');
	const ipUnwrapped = unwrapBrackets(ip);
	if (net.isIP(ipUnwrapped) === 4) {
		const prefix = prefixStr ? parseInt(prefixStr, 10) : 32;
		if (!network || net.isIP(network) !== 4) return false;
		const toNum = (s: string) => s.split('.').reduce((n, o) => (n << 8) + parseInt(o, 10), 0) >>> 0;
		const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
		return (toNum(ipUnwrapped) & mask) === (toNum(network) & mask);
	}
	if (net.isIP(ipUnwrapped) === 6) {
		const prefix = prefixStr ? parseInt(prefixStr, 10) : 128;
		if (!network || net.isIP(unwrapBrackets(network)) !== 6) return false;
		const toBigInt = (s: string): bigint => {
			const parts = unwrapBrackets(s).split(':');
			const fill = 8 - parts.filter((p) => p.length > 0).length;
			const groups: string[] = [];
			let filled = false;
			for (const p of parts) {
				if (p === '') {
					if (!filled) {
						for (let i = 0; i < fill; i++) groups.push('0');
						filled = true;
					}
				} else groups.push(p);
			}
			return groups.reduce((v, g) => (v << 16n) + BigInt(parseInt(g, 16)), 0n);
		};
		const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << (128n - BigInt(prefix));
		return (toBigInt(ip) & mask) === (toBigInt(network) & mask);
	}
	return false;
};

export const isIpInAnyRange = (ip: string): boolean => {
	const ranges = ip.includes(':') ? ipv6Ranges : ipv4Ranges;
	return ranges.some((range) => isIpInCidrRange(ip, range));
};

export const normalizeAllowlistEntry = (entry: string): string => {
	const trimmed = entry.trim();
	if (!trimmed) return '';
	if (isValidDomain(trimmed)) return trimmed.toLowerCase();
	if (trimmed.startsWith('[')) return trimmed;
	if (trimmed.includes(':') && net.isIP(trimmed) === 6) return `[${trimmed}]`;
	return trimmed.toLowerCase();
};

export const normalizeHostForAllowlistMatch = (hostOrIp: string): string => {
	if (hostOrIp.startsWith('[')) return hostOrIp;
	if (hostOrIp.includes(':') && net.isIP(hostOrIp) === 6) return `[${hostOrIp}]`;
	return hostOrIp.toLowerCase();
};

export const parseIpv4WithPort = (input: string): { ip: string; port?: string } | null => {
	const ipv4WithPortPattern = /^(\d+\.\d+\.\d+\.\d+)(?::(\d+))?$/;
	const match = input.match(ipv4WithPortPattern);
	if (match) {
		return { ip: match[1]!, port: match[2] };
	}
	return null;
};

export const allowlistedIpResolved = (ipOrDomain: string, port: string | undefined, wasUrlParsed: boolean): string => {
	if (wasUrlParsed || !port) return ipOrDomain;
	if (ipOrDomain.includes(':')) return `[${ipOrDomain}]:${port}`;
	return `${ipOrDomain}:${port}`;
};
