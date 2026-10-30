import type { E2EESearchCapabilities, ISearchIndexBackend } from '@rocket.chat/desktop-api';

const backendMethods = [
	'open',
	'upsert',
	'remove',
	'removeRoom',
	'listRooms',
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

const hasCapabilities = (capabilities: E2EESearchCapabilities | undefined): boolean =>
	capabilities?.recentCursor === 1 && capabilities.lifecycleEvents === 1 && capabilities.close === 1;

/** Preserves legacy desktop search without a browser fallback. */
export const getDesktopSearchIndexBackend = (): ISearchIndexBackend | undefined => {
	const bridge = typeof window === 'undefined' ? undefined : window.RocketChatDesktop?.e2eeSearch;
	if (!isSearchIndexBackend(bridge)) return undefined;

	const { searchRecentPage, onIndexEvent, close } = bridge;
	const hasMethods = typeof searchRecentPage === 'function' && typeof onIndexEvent === 'function' && typeof close === 'function';
	let recentReady = false;
	let generation = 0;

	return {
		open: async (scope) => {
			const run = ++generation;
			recentReady = false;
			const opened = await bridge.open(scope);
			if (run === generation) recentReady = !opened.locked && hasMethods && hasCapabilities(opened.capabilities);
			return opened;
		},
		upsert: (docs) => bridge.upsert(docs),
		remove: (ids) => bridge.remove(ids),
		removeRoom: (rid) => bridge.removeRoom(rid),
		listRooms: () => bridge.listRooms(),
		search: (query) => bridge.search(query),
		getRoomState: (rid) => bridge.getRoomState(rid),
		setRoomState: (rid, state) => bridge.setRoomState(rid, state),
		stats: () => bridge.stats(),
		wipe: (scope) => {
			generation++;
			recentReady = false;
			return scope ? bridge.wipe(scope) : bridge.wipe();
		},
		...(hasMethods && {
			searchRecentPage: (query) => {
				if (!recentReady) return Promise.reject(new Error('The desktop search backend does not support recent pagination'));
				return searchRecentPage.call(bridge, query);
			},
			onIndexEvent: (listener) => {
				if (!recentReady) throw new Error('The desktop search backend does not support index events');
				const run = generation;
				let subscribed = true;
				const unsubscribe = onIndexEvent.call(bridge, (event) => {
					if (subscribed && recentReady && run === generation) listener(event);
				});
				return () => {
					if (!subscribed) return;
					subscribed = false;
					unsubscribe();
				};
			},
		}),
		...(typeof close === 'function' && {
			close: () => {
				generation++;
				recentReady = false;
				return close.call(bridge);
			},
		}),
	};
};
