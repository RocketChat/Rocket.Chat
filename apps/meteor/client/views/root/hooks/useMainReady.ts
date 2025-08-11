import { useUserId } from '@rocket.chat/ui-contexts';
import { ReactiveVar } from 'meteor/reactive-var';

import { PublicSettingsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import { useUserDataSyncReady } from '../../../lib/userData';

export const mainReady = new ReactiveVar(false);

export const useMainReady = () => {
	const uid = useUserId();
	const subscriptionsReady = SubscriptionsCachedStore.useReady();
	const settingsReady = PublicSettingsCachedStore.useReady();
	const userDataReady = useUserDataSyncReady();

	return !uid || (userDataReady && subscriptionsReady && settingsReady);
};
