import { federationSDK } from '@rocket.chat/federation-sdk';

/**
 * Returns `true` when the given local Rocket.Chat username falls within a bridge's
 * *exclusive* user namespace, meaning only that bridge may own it and a regular user
 * must not be allowed to register/rename into it.
 *
 * Inert (returns `false`) when federation is not configured: with no `serverName` and
 * no loaded appservice registrations, `isExclusiveNamespace` has nothing to match.
 */
export function isUsernameReservedByExclusiveBridge(username: string): boolean {
	const serverName = federationSDK.getConfig('serverName');
	if (!serverName) {
		return false;
	}

	// A local user is represented as `@<username>:<serverName>`. Matrix localparts are
	// conventionally lowercase while Rocket.Chat usernames may be mixed-case, so also test
	// the lowercased localpart — erring towards reserving is the safe failure mode for an
	// exclusive namespace.
	const candidates = new Set([`@${username}:${serverName}`, `@${username.toLowerCase()}:${serverName}`]);

	for (const mxid of candidates) {
		if (federationSDK.isExclusiveNamespace('users', mxid)) {
			return true;
		}
	}

	return false;
}
