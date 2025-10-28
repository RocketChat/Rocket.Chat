import type { IUser } from '@rocket.chat/core-typings';
import { isUserNativeFederated } from '@rocket.chat/core-typings';
import type { UserID } from '@rocket.chat/federation-sdk';

function sanitizeForMatrixLocalpart(username: string): string {
	if (!username) {
		throw new Error('Username cannot be empty');
	}

	let sanitized = username.toLowerCase().replace(/[^a-z0-9._=-]/g, '_');
	sanitized = sanitized.replace(/^_+/, '').replace(/_+$/, '');

	if (sanitized.length === 0) {
		sanitized = 'user';
	}

	if (sanitized.length > 255) {
		sanitized = sanitized.substring(0, 255);
	}

	return sanitized;
}

function validateServerNameFormat(serverName: string): boolean {
	// Handle IPv6 addresses with brackets - they contain multiple colons
	let domain: string;
	let port: string | undefined;

	if (serverName.startsWith('[')) {
		// IPv6 format: [address] or [address]:port
		const ipv6Match = serverName.match(/^(\[[0-9a-f:.]+\])(?::(\d+))?$/i);
		if (!ipv6Match) {
			return false;
		}
		domain = ipv6Match[1];
		port = ipv6Match[2];
	} else {
		// Hostname or IPv4: split on last colon for port
		const lastColonIndex = serverName.lastIndexOf(':');
		if (lastColonIndex === -1) {
			domain = serverName;
		} else {
			domain = serverName.substring(0, lastColonIndex);
			port = serverName.substring(lastColonIndex + 1);
		}
	}

	// validate domain (hostname, IPv4, or IPv6)
	const hostnameRegex = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)*$/i;
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
	const ipv6Regex = /^\[([0-9a-f:.]+)\]$/i;

	if (!(hostnameRegex.test(domain) || ipv4Regex.test(domain) || ipv6Regex.test(domain))) {
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

export function constructMatrixId(username: string, serverName: string): UserID {
	if (!serverName) {
		throw new Error('Server name cannot be empty');
	}

	const trimmed = serverName.trim();
	if (trimmed !== serverName) {
		throw new Error('Server name cannot contain leading or trailing whitespace');
	}

	if (/\s/.test(serverName)) {
		throw new Error('Server name cannot contain spaces');
	}

	// Check for invalid port specifically to provide a better error message
	let port: string | undefined;
	if (serverName.startsWith('[')) {
		const ipv6Match = serverName.match(/^(\[[0-9a-f:.]+\])(?::(\d+))?$/i);
		if (ipv6Match) {
			port = ipv6Match[2];
		}
	} else {
		const lastColonIndex = serverName.lastIndexOf(':');
		if (lastColonIndex !== -1) {
			port = serverName.substring(lastColonIndex + 1);
		}
	}

	if (port !== undefined) {
		const portNum = Number(port);
		if (!/^[0-9]+$/.test(port) || portNum < 1 || portNum > 65535) {
			throw new Error(`Invalid port in server name: ${port} (must be 1-65535)`);
		}
	}

	if (!validateServerNameFormat(serverName)) {
		throw new Error(`Invalid server name format: ${serverName}`);
	}

	const localpart = sanitizeForMatrixLocalpart(username);
	return `@${localpart}:${serverName}` as UserID;
}

export function validateFederatedUsername(mxid: string): mxid is UserID {
	if (!mxid.startsWith('@')) return false;

	const parts = mxid.substring(1).split(':');
	if (parts.length < 2) return false;

	const localpart = parts[0];
	const domainAndPort = parts.slice(1).join(':');

	// validate localpart: only lowercase alphanumeric, ., _, -, or encoded characters
	const localpartRegex = /^(?:[a-z0-9._\-]|=[0-9a-fA-F]{2}){1,255}$/;
	if (!localpartRegex.test(localpart)) return false;

	return validateServerNameFormat(domainAndPort);
}

export function getUserMatrixId(user: Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>, serverName: string): UserID {
	if (isUserNativeFederated(user)) {
		if (!user.federation.mui) {
			throw new Error(`Native federated user ${user._id} is missing Matrix ID (mui)`);
		}
		return user.federation.mui as UserID;
	}

	if (!user.username) {
		throw new Error(`User ${user._id} has no username, cannot generate Matrix ID`);
	}

	return constructMatrixId(user.username, serverName);
}
