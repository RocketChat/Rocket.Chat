import type { IWithManageableCache } from './CachedStore';

class CachedStoresManager {
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

const instance = new CachedStoresManager();

export {
	/** @deprecated */
	instance as CachedStoresManager,
};
