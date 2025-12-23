import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { t } from '../../../app/utils/lib/i18n';
import { PublicSettingsCachedStore, SubscriptionsCachedStore } from '../../cachedStores';
import { dispatchToastMessage } from '../../lib/toast';
import { userIdStore } from '../../lib/user';
import { useUserDataSyncReady } from '../../lib/userData';

const whenMainReady = (): Promise<void> => {
	const isMainReady = (): boolean => {
		const uid = userIdStore.getState();
		if (!uid) return true;

		const subscriptionsReady = SubscriptionsCachedStore.useReady.getState();
		const settingsReady = PublicSettingsCachedStore.useReady.getState();
		const userDataReady = useUserDataSyncReady.getState();

		return userDataReady && subscriptionsReady && settingsReady;
	};

	if (isMainReady()) return Promise.resolve();

	return new Promise((resolve) => {
		const checkAndResolve = () => {
			if (!isMainReady()) return;
			unsubscribeUserId();
			unsubscribeSubscriptions();
			unsubscribeSettings();
			unsubscribeUserData();
			resolve();
		};

		const unsubscribeUserId = userIdStore.subscribe(checkAndResolve);
		const unsubscribeSubscriptions = SubscriptionsCachedStore.useReady.subscribe(checkAndResolve);
		const unsubscribeSettings = PublicSettingsCachedStore.useReady.subscribe(checkAndResolve);
		const unsubscribeUserData = useUserDataSyncReady.subscribe(checkAndResolve);
	});
};

Accounts.onEmailVerificationLink((token: string) => {
	Accounts.verifyEmail(token, async (error) => {
		await whenMainReady();

		if (error) {
			dispatchToastMessage({ type: 'error', message: error });
			throw new Meteor.Error('verify-email', 'E-mail not verified');
		} else {
			void sdk.call('afterVerifyEmail');
			dispatchToastMessage({ type: 'success', message: t('Email_verified') });
		}
	});
});
