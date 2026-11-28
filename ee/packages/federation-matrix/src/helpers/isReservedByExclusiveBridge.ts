import { federationSDK } from '@rocket.chat/federation-sdk';

// The federation SDK does not re-export `NamespaceType`, so mirror the union it accepts.
type NamespaceType = 'users' | 'aliases' | 'rooms';

/**
 * The kind of Rocket.Chat handle being validated. A `user` is a person's username; a `room`
 * is a room or team name. Each maps to different Matrix appservice namespaces.
 */
export type ExclusiveBridgeHandleType = 'user' | 'room';

/**
 * Matrix appservice registrations declare separate exclusive namespaces. A username maps to a
 * user MXID (`@localpart:server`) in the `users` namespace; a room/team name maps to a room
 * alias (`#localpart:server`) — in Rocket.Chat the room alias and the room itself are one
 * concept, so both the `aliases` and `rooms` namespaces are checked.
 */
const NAMESPACES: Record<ExclusiveBridgeHandleType, { sigil: string; namespaces: NamespaceType[] }> = {
	user: { sigil: '@', namespaces: ['users'] },
	room: { sigil: '#', namespaces: ['aliases', 'rooms'] },
};

/**
 * Returns `true` when the given local Rocket.Chat handle falls within a bridge's *exclusive*
 * namespace, meaning only that bridge may own it and a regular user must not be allowed to
 * register/rename into it.
 *
 * Inert (returns `false`) when federation is not configured: with no `serverName` and no loaded
 * appservice registrations, `isExclusiveNamespace` has nothing to match.
 */
export function isReservedByExclusiveBridge(type: ExclusiveBridgeHandleType, name: string): boolean {
	const serverName = federationSDK.getConfig('serverName');
	if (!serverName) {
		return false;
	}

	const { sigil, namespaces } = NAMESPACES[type];

	// Matrix localparts are conventionally lowercase while Rocket.Chat handles may be mixed-case,
	// so also test the lowercased localpart — erring towards reserving is the safe failure mode
	// for an exclusive namespace.
	const candidates = new Set([`${sigil}${name}:${serverName}`, `${sigil}${name.toLowerCase()}:${serverName}`]);

	for (const namespace of namespaces) {
		for (const value of candidates) {
			if (federationSDK.isExclusiveNamespace(namespace, value)) {
				return true;
			}
		}
	}

	return false;
}
