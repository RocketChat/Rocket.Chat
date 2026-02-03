import { isIPv4, isIPv6 } from 'net';

import type { UserID } from '@rocket.chat/federation-sdk';

/** helper to validate the username format */
export function validateFederatedUsername(mxid: string): mxid is UserID {
	if (!mxid.startsWith('@')) return false;

	const withoutAt = mxid.substring(1);
	const firstColonIndex = withoutAt.indexOf(':');

	if (firstColonIndex === -1) return false;

	const localpart = withoutAt.substring(0, firstColonIndex);
	const domainAndPort = withoutAt.substring(firstColonIndex + 1);

	const localpartRegex = /^(?:[a-zA-Z0-9._\-]|=[0-9a-fA-F]{2}){1,255}$/;
	if (!localpartRegex.test(localpart)) return false;

	// Handle IPv6 addresses specially - they're wrapped in brackets and contain colons
	let domain: string;
	let port: string | undefined;

	if (domainAndPort.startsWith('[')) {
		// IPv6 address
		const closeBracketIndex = domainAndPort.indexOf(']');
		if (closeBracketIndex === -1) return false;

		domain = domainAndPort.substring(0, closeBracketIndex + 1);

		// Check if there's a port after the IPv6 address
		const afterBracket = domainAndPort.substring(closeBracketIndex + 1);
		if (afterBracket.startsWith(':')) {
			port = afterBracket.substring(1);
		} else if (afterBracket.length > 0) {
			return false; // Invalid format after IPv6 bracket
		}
	} else {
		// Regular domain or IPv4
		const lastColonIndex = domainAndPort.lastIndexOf(':');
		const possiblePort = domainAndPort.substring(lastColonIndex + 1);

		// Check if the part after the last colon is a valid port number
		if (lastColonIndex !== -1 && /^[0-9]+$/.test(possiblePort)) {
			domain = domainAndPort.substring(0, lastColonIndex);
			port = possiblePort;
		} else {
			domain = domainAndPort;
		}
	}

	// Validate domain: hostname, IPv4, or IPv6
	const hostnameRegex = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)*$/i;

	// Check if it's a valid IPv6 address (in brackets)
	if (domain.startsWith('[') && domain.endsWith(']')) {
		const ipv6Address = domain.substring(1, domain.length - 1);
		if (!isIPv6(ipv6Address)) {
			return false;
		}
	} else if (isIPv4(domain)) {
		// Valid IPv4 address
	} else if (!hostnameRegex.test(domain)) {
		// Not a valid hostname
		return false;
	}

	if (port !== undefined) {
		const portNum = Number(port);
		if (!/^[0-9]+$/.test(port) || portNum < 1 || portNum > 65535) {
			return false;
		}
	}

	return true;
}
