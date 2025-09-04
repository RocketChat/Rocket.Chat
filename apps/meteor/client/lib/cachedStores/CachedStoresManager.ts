import { LOGIN_TOKEN_KEY, userStorage } from '../user';
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

userStorage.on('change', () => {
	const loginToken = userStorage.getItem(LOGIN_TOKEN_KEY);
	if (loginToken) return;

	instance.clearAllCachesOnLogout();
});
