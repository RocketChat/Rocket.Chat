import { lookup } from 'dns';

import { Settings } from '@rocket.chat/models';

import {
	allowlistedIpResolved,
	isIpInAnyRange,
	isIpValid,
	isValidDomain,
	normalizeAllowlistEntry,
	normalizeHostForAllowlistMatch,
	parseIpv4WithPort,
} from './checkForSsrfHelpers';

export const parseSsrfAllowlist = (value: string | undefined): string[] => {
	if (typeof value !== 'string' || !value.trim()) return [];
	return value
		.split(/[\n,]/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
};

const getEffectiveAllowlist = async (): Promise<string[]> => {
	const raw = await Settings.getValueById<string>('SSRF_Allowlist');
	return parseSsrfAllowlist(raw)
		.map(normalizeAllowlistEntry)
		.filter((entry) => entry.length > 0);
};

const isInAllowlist = async (hostOrIp: string, port: string | undefined): Promise<boolean> => {
	const normalized = normalizeHostForAllowlistMatch(hostOrIp);
	const withPort = port ? `${normalized}:${port}` : normalized;
	const allowlist = await getEffectiveAllowlist();
	return allowlist.some((entry) => entry === normalized || entry === withPort);
};

export const nslookup = (hostname: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		lookup(hostname, (err, address) => {
			if (err) reject(err);
			else resolve(address);
		});
	});
};

export const checkForSsrf = async (input: string): Promise<boolean> => {
	const result = await checkForSsrfWithIp(input);
	return result.allowed;
};

export const checkForSsrfWithIp = async (input: string): Promise<{ allowed: false } | { allowed: true; resolvedIp: string }> => {
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
		if (parsed.port && !port) port = parsed.port;
	}

	const ipValid = isIpValid(ipOrDomain);
	const domainValid = isValidDomain(ipOrDomain);

	if (!ipValid && !domainValid) return { allowed: false };

	if (await isInAllowlist(ipOrDomain, port)) {
		if (ipValid) {
			return { allowed: true, resolvedIp: allowlistedIpResolved(ipOrDomain, port, wasUrlParsed) };
		}
		if (domainValid) {
			try {
				const resolvedIp = await nslookup(ipOrDomain);
				const resolvedIpWithPort = !wasUrlParsed && port ? `${resolvedIp}:${port}` : resolvedIp;
				return { allowed: true, resolvedIp: resolvedIpWithPort };
			} catch {
				return { allowed: false };
			}
		}
	}

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
