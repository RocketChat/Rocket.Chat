/**
 * Strips a leading '@' from a username if present.
 *
 * Federated usernames (e.g. @john.doe:matrix.org) are stored with a leading '@',
 * while local usernames are not. This utility normalises both forms so callers
 * that render `@{username}` don't accidentally produce `@@john.doe:matrix.org`.
 */
export const normalizeUsername = (username: string): string => (username.startsWith('@') ? username.slice(1) : username);
