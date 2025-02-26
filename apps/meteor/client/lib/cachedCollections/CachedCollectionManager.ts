import type { CachedCollection } from './CachedCollection';

class CachedCollectionManager {
	private items = new Set<CachedCollection<any>>();

	register(cachedCollection: CachedCollection<any>) {
		this.items.add(cachedCollection);
	}

	clearAllCachesOnLogout() {
		for (const item of this.items) {
			item.clearCacheOnLogout();
		}
	}
}

const instance = new CachedCollectionManager();

export {
	/** @deprecated */
	instance as CachedCollectionManager,
};
