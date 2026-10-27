import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

const backendMethods = [
	'open',
	'upsert',
	'remove',
	'removeRoom',
	'search',
	'getRoomState',
	'setRoomState',
	'stats',
	'wipe',
] as const satisfies readonly (keyof ISearchIndexBackend)[];

const isSearchIndexBackend = (bridge: unknown): bridge is ISearchIndexBackend =>
	typeof bridge === 'object' &&
	bridge !== null &&
	backendMethods.every((method) => typeof (bridge as Record<string, unknown>)[method] === 'function');

/**
 * Returns the desktop app's local search index for end-to-end encrypted messages, or `undefined` when this desktop
 * version offers no complete one. Without a backend, encrypted rooms keep today's behavior: they cannot be searched.
 */
export const getDesktopSearchIndexBackend = (): ISearchIndexBackend | undefined => {
	const bridge = typeof window === 'undefined' ? undefined : window.RocketChatDesktop?.e2eeSearch;
	if (!isSearchIndexBackend(bridge)) return undefined;

	return {
		open: (scope) => bridge.open(scope),
		upsert: (docs) => bridge.upsert(docs),
		remove: (ids) => bridge.remove(ids),
		removeRoom: (rid) => bridge.removeRoom(rid),
		search: (query) => bridge.search(query),
		getRoomState: (rid) => bridge.getRoomState(rid),
		setRoomState: (rid, state) => bridge.setRoomState(rid, state),
		stats: () => bridge.stats(),
		wipe: (scope) => (scope ? bridge.wipe(scope) : bridge.wipe()),
	};
};
