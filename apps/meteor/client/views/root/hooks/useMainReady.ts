import { useUserId } from '@rocket.chat/ui-contexts';

import { LoggedSettingsCachedStore, PublicSettingsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import { useUserDataSyncReady } from '../../../lib/userData';

export const useMainReady = () => {
	const uid = useUserId();
	const subscriptionsReady = SubscriptionsCachedStore.useReady();
	const settingsReady = PublicSettingsCachedStore.useReady();
	const loggedSettingsReady = LoggedSettingsCachedStore.useReady();
	const userDataReady = useUserDataSyncReady();

	return !uid || (userDataReady && subscriptionsReady && settingsReady && loggedSettingsReady);
};
