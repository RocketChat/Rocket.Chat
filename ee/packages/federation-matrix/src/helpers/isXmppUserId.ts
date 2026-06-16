import { decodeXmppUserId, parseXmppUserId } from './parseXmppUserId';

/** Default matrix-bifrost user prefix for the XMPP protocol on this deployment. */
export const XMPP_USER_ID_PREFIX = '_xmpp_';

// Hostname grammar (RFC 1123 labels), same shape used by validateFederatedUsername.
const DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/**
 * Check whether a Matrix localpart (e.g. `body.username` from an AS `/register`
 * call) is a bridged XMPP user, so the caller can decide whether to run
 * {@link parseXmppUserId} on it.
 *
 * A value qualifies when it carries the bridge prefix **and** the remainder
 * decodes to a well-formed `local@domain` JID. The structural check guards
 * against a normal user that merely happens to start with the prefix.
 *
 * @param userId - the localpart to test, e.g. `_xmpp_prince=2fmychannel=40conference.xmpp.host`
 * @param prefix - bridge prefix to require; pass `''` to validate a bare escaped JID
 *
 * @example
 * isXmppUserId('_xmpp_prince=2fmychannel=40conference.xmpp.host'); // true
 * isXmppUserId('john.doe');                                        // false
 */
export const isXmppUserId = (userId: string, prefix: string = XMPP_USER_ID_PREFIX): boolean => {
	if (!userId.startsWith(prefix)) {
		return false;
	}

	try {
		const { local, domain } = parseXmppUserId(decodeXmppUserId(userId.substring(prefix.length)));
		return local.length > 0 && DOMAIN_REGEX.test(domain);
	} catch {
		return false;
	}
};
