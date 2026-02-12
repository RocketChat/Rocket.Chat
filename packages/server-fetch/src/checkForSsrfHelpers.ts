import net from 'net';

const domainPattern = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,63}$/;
export const isValidDomain = (domain: string) => domainPattern.test(domain);

export const unwrapBrackets = (address: string) => (address.startsWith('[') && address.endsWith(']') ? address.slice(1, -1) : address);

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
	if (net.isIPv4(ipUnwrapped)) {
		const prefix = prefixStr ? parseInt(prefixStr, 10) : 32;
		if (!network || !net.isIPv4(network)) {
			return false;
		}

		const toNum = (ipString: string) =>
			ipString.split('.').reduce((accumulated, octet) => (accumulated << 8) + parseInt(octet, 10), 0) >>> 0;
		const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
		return (toNum(ipUnwrapped) & mask) === (toNum(network) & mask);
	}
	if (net.isIPv6(ipUnwrapped)) {
		const prefix = prefixStr ? parseInt(prefixStr, 10) : 128;
		if (!network || !net.isIPv6(unwrapBrackets(network))) return false;
		const toBigInt = (address: string): bigint => {
			const parts = unwrapBrackets(address).split(':');
			const nonEmptyParts = parts.filter((part) => part.length > 0);
			const fill = 8 - nonEmptyParts.reduce((count, part) => count + (part.includes('.') ? 2 : 1), 0);
			const groups: string[] = [];
			let filled = false;
			for (const part of parts) {
				if (part === '') {
					if (!filled) {
						for (let index = 0; index < fill; index++) groups.push('0');
						filled = true;
					}
				} else if (part.includes('.')) {
					if (!net.isIPv4(part)) return 0n;
					const num = part.split('.').reduce((accumulated, octet) => (accumulated << 8) + parseInt(octet, 10), 0) >>> 0;
					groups.push((num >>> 16).toString(16), (num & 0xffff).toString(16));
				} else {
					groups.push(part);
				}
			}
			return groups.reduce((value, hexGroup) => (value << 16n) + BigInt(parseInt(hexGroup, 16)), 0n);
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
	if (trimmed.includes(':') && net.isIPv6(trimmed)) return `[${trimmed}]`;
	return trimmed.toLowerCase();
};

export const normalizeHostForAllowlistMatch = (hostOrIp: string): string => {
	if (hostOrIp.startsWith('[')) {
		return hostOrIp;
	}
	if (hostOrIp.includes(':') && net.isIPv6(hostOrIp)) {
		return `[${hostOrIp}]`;
	}
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
