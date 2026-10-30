const storageKeyPrefix = 'E2EESearch_OptIn_v2_';
const syncTimeKeyPrefix = 'E2EESearch_SyncedAt_v2_';
const listeners = new Map<string, Set<() => void>>();

const canonicalWorkspace = (workspaceUrl: string): string | undefined => {
	try {
		const url = new URL(workspaceUrl);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return undefined;
		if (!url.pathname.endsWith('/')) url.pathname += '/';
		return url.href;
	} catch {
		return undefined;
	}
};

const storageKey = (workspace: string, userId: string) => `${storageKeyPrefix}${JSON.stringify([workspace, userId])}`;

/** Keeps device consent separate for each workspace and user. */
export const isSearchIndexOptedIn = (workspaceUrl: string, userId: string | undefined): boolean => {
	const workspace = canonicalWorkspace(workspaceUrl);
	if (!workspace || !userId) return false;
	try {
		return window.localStorage.getItem(storageKey(workspace, userId)) === 'true';
	} catch {
		return false;
	}
};

export const setSearchIndexOptIn = (workspaceUrl: string, userId: string, optedIn: boolean): boolean => {
	const workspace = canonicalWorkspace(workspaceUrl);
	if (!workspace || !userId) return false;
	let saved = true;
	try {
		if (optedIn) {
			window.localStorage.setItem(storageKey(workspace, userId), 'true');
		} else {
			window.localStorage.removeItem(storageKey(workspace, userId));
		}
	} catch {
		saved = false;
	}
	for (const listener of [...(listeners.get(workspace) ?? [])]) listener();
	return saved;
};

const isWorkspaceStorageEvent = (event: StorageEvent, workspace: string): boolean => {
	if (event.storageArea !== null && event.storageArea !== window.localStorage) return false;
	if (event.key === null) return true;
	if (!event.key.startsWith(storageKeyPrefix)) return false;
	try {
		const scope: unknown = JSON.parse(event.key.slice(storageKeyPrefix.length));
		return Array.isArray(scope) && scope.length === 2 && scope[0] === workspace && typeof scope[1] === 'string';
	} catch {
		return false;
	}
};

export const subscribeToSearchIndexOptIn = (workspaceUrl: string, listener: () => void): (() => void) => {
	const workspace = canonicalWorkspace(workspaceUrl);
	if (!workspace) return () => undefined;
	const workspaceListeners = listeners.get(workspace) ?? new Set<() => void>();
	workspaceListeners.add(listener);
	listeners.set(workspace, workspaceListeners);
	const handleStorage = (event: StorageEvent) => {
		let relevant = true;
		try {
			relevant = isWorkspaceStorageEvent(event, workspace);
		} catch {
			relevant = true;
		}
		if (relevant) listener();
	};
	window.addEventListener('storage', handleStorage);
	return () => {
		workspaceListeners.delete(listener);
		if (!workspaceListeners.size) listeners.delete(workspace);
		window.removeEventListener('storage', handleStorage);
	};
};

/** Keep catch-up time separate for each workspace and user. */
export const createSearchIndexSyncTimeStore = (workspaceUrl: string, getUserId: () => string | undefined) => {
	const workspace = canonicalWorkspace(workspaceUrl);
	const keyOf = () => {
		const userId = getUserId();
		return workspace && userId ? `${syncTimeKeyPrefix}${JSON.stringify([workspace, userId])}` : undefined;
	};
	return {
		read(): number | undefined {
			const key = keyOf();
			if (!key) return undefined;
			try {
				const value = Number(window.localStorage.getItem(key));
				return Number.isFinite(value) && value > 0 ? value : undefined;
			} catch {
				return undefined;
			}
		},
		write(at: number): void {
			const key = keyOf();
			if (!key || !Number.isFinite(at) || at <= 0) return;
			try {
				window.localStorage.setItem(key, String(at));
			} catch {
				return undefined;
			}
		},
	};
};

const hasCanonicalScope = (key: string, prefix: string): boolean => {
	if (!key.startsWith(prefix)) return false;
	try {
		const scope: unknown = JSON.parse(key.slice(prefix.length));
		return (
			Array.isArray(scope) &&
			scope.length === 2 &&
			typeof scope[0] === 'string' &&
			canonicalWorkspace(scope[0]) === scope[0] &&
			typeof scope[1] === 'string' &&
			scope[1].length > 0
		);
	} catch {
		return false;
	}
};

/** Preserve scoped consent and catch-up times without transient opt-out events during logout. */
export const clearLocalStorageKeepingSearchIndexOptIns = (): void => {
	const removed: string[] = [];
	try {
		for (let index = 0; index < window.localStorage.length; index++) {
			const key = window.localStorage.key(index);
			if (key === null) continue;
			const value = window.localStorage.getItem(key);
			const consent = hasCanonicalScope(key, storageKeyPrefix) && value === 'true';
			const time = hasCanonicalScope(key, syncTimeKeyPrefix) && value !== null && Number.isFinite(Number(value)) && Number(value) > 0;
			if (!consent && !time) removed.push(key);
		}
	} catch {
		try {
			window.localStorage.clear();
		} catch {
			return;
		}
		return;
	}
	for (const key of removed) {
		try {
			window.localStorage.removeItem(key);
		} catch {
			continue;
		}
	}
};
