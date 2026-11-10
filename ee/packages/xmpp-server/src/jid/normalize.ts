import { domainToASCII } from 'node:url';

import { InvalidJidError } from '../errors';

const URL_SYNTAX = /[\s/?#\\%]/;

/**
 * Normalizes an XMPP domain for trust comparisons (dialback, spoof checks, allow lists).
 * Applies IDNA ASCII conversion and lowercasing. Full stringprep/PRECIS is out of scope.
 */
export function normalizeDomain(domain: string): string {
	const trimmed = domain.trim();
	const ascii = URL_SYNTAX.test(trimmed) ? '' : domainToASCII(trimmed).replace(/\.$/, '');
	if (!ascii || ascii.split('.').includes('')) {
		throw new InvalidJidError(domain);
	}

	return ascii.toLowerCase();
}

/** A user's bare JID (`local@domain`) with its domain normalized; throws for anything that names no user. */
export function normalizeUserBareJid(jid: string): string {
	const [bare] = jid.split('/');
	const at = bare.lastIndexOf('@');
	const local = bare.slice(0, at);
	if (at <= 0 || local.includes('@')) {
		throw new InvalidJidError(jid);
	}

	return `${local}@${normalizeDomain(bare.slice(at + 1))}`;
}

/** `jid` with its domainpart replaced by `domain`, localpart and resource kept as they are. */
export function withDomain(jid: string, domain: string): string {
	const slash = jid.indexOf('/');
	const bare = slash === -1 ? jid : jid.slice(0, slash);
	const resource = slash === -1 ? '' : jid.slice(slash);
	const at = bare.lastIndexOf('@');
	return `${bare.slice(0, at + 1)}${domain}${resource}`;
}

/** A room's bare JID in the one spelling every reference to that room maps to; throws for anything that names no room. */
export function normalizeRoomJid(jid: string): string {
	const bare = normalizeUserBareJid(jid);
	const at = bare.indexOf('@');
	return `${bare.slice(0, at).toLowerCase()}${bare.slice(at)}`;
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
