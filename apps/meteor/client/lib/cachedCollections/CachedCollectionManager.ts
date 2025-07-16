import type { IWithManageableCache } from './CachedCollection';

class CachedCollectionManager {
	private items = new Set<IWithManageableCache>();

	register(cachedCollection: IWithManageableCache) {
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
