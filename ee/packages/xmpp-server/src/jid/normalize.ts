import { domainToASCII } from 'node:url';

import { InvalidJidError } from '../errors';

/**
 * Normalizes an XMPP domain for trust comparisons (dialback, spoof checks, allow lists).
 * Applies IDNA ASCII conversion and lowercasing. Full stringprep/PRECIS is out of scope.
 */
export function normalizeDomain(domain: string): string {
	const trimmed = domain.trim().replace(/\.$/, '');
	if (!trimmed) {
		throw new InvalidJidError(domain);
	}

	const ascii = domainToASCII(trimmed);
	if (!ascii) {
		throw new InvalidJidError(domain);
	}

	return ascii.toLowerCase();
}

export function isDomainAllowed(domain: string, allowedDomains?: string[], deniedDomains?: string[]): boolean {
	const normalized = normalizeDomain(domain);

	if (deniedDomains?.some((denied) => normalizeDomain(denied) === normalized)) {
		return false;
	}

	if (allowedDomains && allowedDomains.length > 0) {
		return allowedDomains.some((allowed) => normalizeDomain(allowed) === normalized);
	}

	return true;
}
