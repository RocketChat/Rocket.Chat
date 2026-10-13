import { LoggedSettingsCachedStore } from '../cachedStores';
import { userIdStore } from '../lib/user';

LoggedSettingsCachedStore.listen();

userIdStore.subscribe((uid, previousUid) => {
	if (uid || !previousUid) {
		return;
	}

	void LoggedSettingsCachedStore.release();
	LoggedSettingsCachedStore.clearCacheOnLogout();
});
