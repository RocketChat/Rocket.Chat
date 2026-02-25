import { lookup } from 'dns';
import net from 'net';

import { domainPattern, ipv4Ranges, ipv4WithPortPattern, ipv6Ranges } from './constants';

export const isValidDomain = (domain: string) => domainPattern.test(domain);

export const unwrapBrackets = (address: string) => (address.startsWith('[') && address.endsWith(']') ? address.slice(1, -1) : address);

export const isIpValid = (ip: string): boolean => net.isIP(unwrapBrackets(ip)) !== 0;

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
		if (!network || !net.isIPv6(unwrapBrackets(network))) {
			return false;
		}
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
					if (!net.isIPv4(part)) {
						return 0n;
					}
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
	if (!trimmed) {
		return '';
	}
	if (isValidDomain(trimmed)) {
		return trimmed.toLowerCase();
	}
	if (trimmed.startsWith('[')) {
		return trimmed;
	}
	if (trimmed.includes(':') && net.isIPv6(trimmed)) {
		return `[${trimmed}]`;
	}
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
	const match = input.match(ipv4WithPortPattern);
	if (match) {
		return { ip: match[1]!, port: match[2] };
	}
	return null;
};

export const allowlistedIpResolved = (ipOrDomain: string, port: string | undefined, wasUrlParsed: boolean): string => {
	if (wasUrlParsed || !port) {
		return ipOrDomain;
	}
	if (ipOrDomain.includes(':')) {
		return `[${ipOrDomain}]:${port}`;
	}
	return `${ipOrDomain}:${port}`;
};

export function nslookup(hostname: string): Promise<string> {
	return new Promise((resolve, reject) => {
		lookup(hostname, (err, address) => {
			if (err) reject(err);
			else resolve(address);
		});
	});
}

export function checkDirectIp(ip: string): boolean {
	return /^(\d+\.\d+\.\d+\.\d+|\[?[0-9a-fA-F:]+]?)$/.test(ip);
}

export function extractHostname(urlString: string): string | null {
	try {
		const { hostname } = new URL(urlString);
		if (hostname.startsWith('[') && hostname.endsWith(']')) {
			return hostname.slice(1, -1);
		}
		return hostname;
	} catch {
		return null;
	}
}

export function buildPinnedUrl(originalUrl: string, resolvedIp: string): string {
	try {
		const url = new URL(originalUrl);

		let ipAddress: string;

		const ipv4WithPortMatch = resolvedIp.match(/^(\d+\.\d+\.\d+\.\d+)(?::(\d+))$/);
		if (ipv4WithPortMatch) {
			ipAddress = ipv4WithPortMatch[1];
		} else if (resolvedIp.includes(':') && !resolvedIp.includes('.')) {
			const ipv6WithPortMatch = resolvedIp.match(/^(\[[0-9a-fA-F:]+\])(?::(\d+))$/);
			if (ipv6WithPortMatch) {
				ipAddress = ipv6WithPortMatch[1];
			} else {
				ipAddress = resolvedIp.startsWith('[') && resolvedIp.endsWith(']') ? resolvedIp : `[${resolvedIp}]`;
			}
		} else {
			// IPv4 without port
			ipAddress = resolvedIp;
		}

		url.hostname = ipAddress;

		return url.toString();
	} catch {
		return originalUrl;
	}
}
