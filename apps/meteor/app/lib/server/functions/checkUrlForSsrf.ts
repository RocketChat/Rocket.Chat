import { lookup } from 'dns';

// https://en.wikipedia.org/wiki/Reserved_IP_addresses + Alibaba Metadata IP
const ranges: string[] = [
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

export const nslookup = async (hostname: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		lookup(hostname, (error, address) => {
			if (error) {
				reject(error);
			} else {
				resolve(address);
			}
		});
	});
};

export const ipToLong = (ip: string): number => {
	return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

export const isIpInRange = (ip: string, range: string): boolean => {
	const [rangeIp, subnet] = range.split('/');
	const ipLong = ipToLong(ip);
	const rangeIpLong = ipToLong(rangeIp);
	const mask = ~(2 ** (32 - Number(subnet)) - 1);
	return (ipLong & mask) === (rangeIpLong & mask);
};

export const isIpInAnyRange = (ip: string): boolean => ranges.some((range) => isIpInRange(ip, range));

export const isValidIPv4 = (ip: string): boolean => {
	const octets = ip.split('.');
	if (octets.length !== 4) return false;
	return octets.every((octet) => {
		const num = Number(octet);
		return num >= 0 && num <= 255 && octet === num.toString();
	});
};

export const isValidDomain = (domain: string): boolean => {
	const domainPattern = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)\.?([A-Za-z]{2,63}\.?)*[A-Za-z]{2,63}$/;
	if (!domainPattern.test(domain)) {
		return false;
	}
	return true;
};

export const checkUrlForSsrf = async (url: string): Promise<boolean> => {
	if (!(url.startsWith('http://') || url.startsWith('https://'))) {
		return false;
	}

	const [, address] = url.split('://');
	const ipOrDomain = address.includes('/') ? address.split('/')[0] : address;

	if (!(isValidIPv4(ipOrDomain) || isValidDomain(ipOrDomain))) {
		return false;
	}

	if (isValidIPv4(ipOrDomain) && isIpInAnyRange(ipOrDomain)) {
		return false;
	}

	if (isValidDomain(ipOrDomain) && /metadata.google.internal/.test(ipOrDomain.toLowerCase())) {
		return false;
	}

	if (isValidDomain(ipOrDomain)) {
		try {
			const ipAddress = await nslookup(ipOrDomain);
			if (isIpInAnyRange(ipAddress)) {
				return false;
			}
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	return true;
};
