import { lookup } from 'dns';

import { Address4, Address6 } from 'ip-address';

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

export const nslookup = (hostname: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		lookup(hostname, (err, address) => {
			if (err) reject(err);
			else resolve(address);
		});
	});
};

const getIpObject = (ip: string) => {
	if (ip.includes(':')) return new Address6(ip);
	return new Address4(ip);
};

const isIpValid = (ip: string) => {
	if (ip.includes(':')) return Address6.isValid(ip);
	return Address4.isValid(ip);
};

const isIpInAnyRange = (ip: string) => {
	const ranges = ip.includes(':') ? ipv6Ranges : ipv4Ranges;
	const ipAddress = getIpObject(ip);
	return ranges.some((range) => {
		const rangeObj = getIpObject(range);
		return ipAddress.isInSubnet(rangeObj);
	});
};

const domainPattern = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)\.?([A-Za-z0-9-]{2,63}\.?)*[A-Za-z]{2,63}$/;
const isValidDomain = (domain: string) => domainPattern.test(domain);

const parseIpv4WithPort = (input: string): { ip: string; port?: string } | null => {
	const ipv4WithPortPattern = /^(\d+\.\d+\.\d+\.\d+)(?::(\d+))?$/;
	const match = input.match(ipv4WithPortPattern);
	if (match) {
		return {
			ip: match[1],
			port: match[2],
		};
	}
	return null;
};

export const checkForSsrf = async (input: string): Promise<boolean> => {
	const result = await checkForSsrfWithIp(input);
	return result.allowed;
};

export const checkForSsrfWithIp = async (input: string): Promise<{ allowed: boolean; resolvedIp?: string }> => {
	let ipOrDomain: string;
	let port: string | undefined;
	let wasUrlParsed = false;

	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return { allowed: false };
		ipOrDomain = url.hostname;
		port = url.port || undefined;
		wasUrlParsed = true;
	} catch {
		const parsed = parseIpv4WithPort(input);
		if (parsed) {
			ipOrDomain = parsed.ip;
			port = parsed.port;
		} else {
			ipOrDomain = input;
		}
	}

	if (ipOrDomain.startsWith('[') && ipOrDomain.endsWith(']')) {
		ipOrDomain = ipOrDomain.slice(1, -1);
	}

	const parsed = parseIpv4WithPort(ipOrDomain);
	if (parsed) {
		ipOrDomain = parsed.ip;
		if (parsed.port && !port) {
			port = parsed.port;
		}
	}

	const ipValid = isIpValid(ipOrDomain);
	const domainValid = isValidDomain(ipOrDomain);

	if (!ipValid && !domainValid) return { allowed: false };
	if (ipValid && isIpInAnyRange(ipOrDomain)) return { allowed: false };
	if (domainValid && /metadata\.google\.internal/i.test(ipOrDomain)) return { allowed: false };

	if (domainValid) {
		try {
			const resolvedIp = await nslookup(ipOrDomain);
			if (isIpInAnyRange(resolvedIp)) return { allowed: false };
			const resolvedIpWithPort = !wasUrlParsed && port ? `${resolvedIp}:${port}` : resolvedIp;
			return { allowed: true, resolvedIp: resolvedIpWithPort };
		} catch {
			return { allowed: false };
		}
	}

	const ipWithPort = !wasUrlParsed && port ? `${ipOrDomain}:${port}` : ipOrDomain;
	return { allowed: true, resolvedIp: ipWithPort };
};
