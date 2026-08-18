import type { IWithManageableCache } from './CachedStore';
import { getDdpSdk } from '../sdk/ddpSdk';

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

getDdpSdk().account.onLogout(() => instance.clearAllCachesOnLogout());

export {
	/** @deprecated */
	instance as CachedStoresManager,
};
