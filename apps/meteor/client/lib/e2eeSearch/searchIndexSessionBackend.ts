import type { E2EESearchIndexEvent, ISearchIndexBackend } from '@rocket.chat/desktop-api';

/** Prevent work from an ended session from using a later open of the same backend. */
export const createSearchIndexSessionBackend = (raw: ISearchIndexBackend) => {
	let revoked = false;
	const subscriptions = new Set<() => void>();
	const assertActive = () => {
		if (revoked) throw new Error('The E2EE search index session has ended');
	};
	const run = async <T>(call: () => Promise<T>): Promise<T> => {
		assertActive();
		const result = await call();
		assertActive();
		return result;
	};
	const revoke = () => {
		if (revoked) return;
		revoked = true;
		let failure: unknown;
		for (const unsubscribe of [...subscriptions]) {
			try {
				unsubscribe();
			} catch (error) {
				failure ??= error;
			}
		}
		if (failure !== undefined) throw failure;
	};
	const backend: ISearchIndexBackend = {
		open: async () => {
			throw new Error('An E2EE search session handle cannot open another index');
		},
		upsert: (docs) => run(() => raw.upsert(docs)),
		remove: (ids) => run(() => raw.remove(ids)),
		removeRoom: (rid) => run(() => raw.removeRoom(rid)),
		listRooms: () => run(() => raw.listRooms()),
		search: (query) => run(() => raw.search(query)),
		getRoomState: (rid) => run(() => raw.getRoomState(rid)),
		setRoomState: (rid, state) => run(() => raw.setRoomState(rid, state)),
		stats: () => run(() => raw.stats()),
		wipe: async (scope) => {
			assertActive();
			try {
				revoke();
			} finally {
				await raw.wipe(scope);
			}
		},
		...(typeof raw.searchRecentPage === 'function' && {
			searchRecentPage: (query) => run(() => raw.searchRecentPage!(query)),
		}),
		...(typeof raw.close === 'function' && {
			close: async () => {
				assertActive();
				try {
					revoke();
				} finally {
					await raw.close!();
				}
			},
		}),
		...(typeof raw.onIndexEvent === 'function' && {
			onIndexEvent: (listener: (event: E2EESearchIndexEvent) => void) => {
				assertActive();
				let subscribed = true;
				let unsubscribeRaw: (() => void) | undefined;
				const unsubscribe = () => {
					if (!subscribed) return;
					subscribed = false;
					subscriptions.delete(unsubscribe);
					unsubscribeRaw?.();
				};
				subscriptions.add(unsubscribe);
				try {
					unsubscribeRaw = raw.onIndexEvent!((event) => {
						if (!revoked && subscribed) listener(event);
					});
					if (!subscribed) unsubscribeRaw();
				} catch (error) {
					unsubscribe();
					throw error;
				}
				return unsubscribe;
			},
		}),
	};
	return { backend, revoke };
};
