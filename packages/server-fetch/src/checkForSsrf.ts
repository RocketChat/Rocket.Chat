import { isTruthy } from '@rocket.chat/tools';

import {
	allowlistedIpResolved,
	isIpInAnyRange,
	isIpValid,
	isValidDomain,
	normalizeAllowlistEntry,
	normalizeHostForAllowlistMatch,
	nslookup,
	parseIpv4WithPort,
} from './helpers';

export const parseSsrfAllowlist = (value: string): string[] => {
	if (!value.trim()) {
		return [];
	}
	return value
		.split(/[\n,]/)
		.map((entry) => entry.trim())
		.filter(isTruthy);
};

function getEffectiveAllowlist(allowListRaw: string[]): string[] {
	return allowListRaw.map(normalizeAllowlistEntry).filter((entry) => entry.length > 0);
}

/** Normalize allowList (string or string[]) to a single effective list. Parses raw string in this single place. */
function toEffectiveAllowlist(allowList?: string | string[]): string[] {
	if (allowList === undefined || allowList === null) {
		return [];
	}
	if (typeof allowList === 'string') {
		return getEffectiveAllowlist(parseSsrfAllowlist(allowList));
	}
	return getEffectiveAllowlist(allowList);
}

function isInAllowlist(hostOrIp: string, port: string | undefined, allowlist: string[]): boolean {
	if (allowlist.length === 0) {
		return false;
	}
	const normalized = normalizeHostForAllowlistMatch(hostOrIp);
	const withPort = port ? `${normalized}:${port}` : normalized;
	return allowlist.some((entry) => entry === normalized || entry === withPort);
}

/**
 * Returns whether the URL is allowed by SSRF rules.
 * @param input - URL or host to check
 * @param allowList - Optional raw string (newline/comma-separated) or array of allowed hosts/IPs/CIDRs. Parsed inside.
 */
export const checkForSsrf = async (input: string, allowList?: string | string[]): Promise<boolean> => {
	const result = await checkForSsrfWithIp(input, allowList);
	return result.allowed;
};

/**
 * SSRF check with resolved IP for pinning. allowList is optional; string is parsed in this single place.
 */
export const checkForSsrfWithIp = async (
	input: string,
	allowList?: string | string[],
): Promise<{ allowed: false } | { allowed: true; resolvedIp: string }> => {
	const effectiveAllowlist = toEffectiveAllowlist(allowList);
	let ipOrDomain: string;
	let port: string | undefined;
	let wasUrlParsed = false;

	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return { allowed: false };
		}
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

	if (!ipValid && !domainValid) {
		return { allowed: false };
	}

	if (isInAllowlist(ipOrDomain, port, effectiveAllowlist)) {
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

	if (ipValid && isIpInAnyRange(ipOrDomain)) {
		return { allowed: false };
	}
	if (domainValid && /metadata\.google\.internal/i.test(ipOrDomain)) {
		return { allowed: false };
	}

	if (!domainValid) {
		const ipWithPort = !wasUrlParsed && port ? `${ipOrDomain}:${port}` : ipOrDomain;
		return { allowed: true, resolvedIp: ipWithPort };
	}

	try {
		const resolvedIp = await nslookup(ipOrDomain);
		if (isIpInAnyRange(resolvedIp)) {
			return { allowed: false };
		}

		const resolvedIpWithPort = !wasUrlParsed && port ? `${resolvedIp}:${port}` : resolvedIp;
		return { allowed: true, resolvedIp: resolvedIpWithPort };
	} catch {
		return { allowed: false };
	}
};
