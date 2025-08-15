import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import { PublicSettingsCachedStore, SubscriptionsCachedStore } from '../cachedStores';
import { watch } from '../lib/cachedStores';
import { dispatchToastMessage } from '../lib/toast';
import { useUserDataSyncReady } from '../lib/userData';

const watchMainReady = () => {
	const uid = Meteor.userId();
	const subscriptionsReady = watch(SubscriptionsCachedStore.useReady, (state) => state);
	const settingsReady = watch(PublicSettingsCachedStore.useReady, (state) => state);
	const userDataReady = watch(useUserDataSyncReady, (state) => state);

	return !uid || (userDataReady && subscriptionsReady && settingsReady);
};

Accounts.onEmailVerificationLink((token: string) => {
	Accounts.verifyEmail(token, (error) => {
		Tracker.autorun(() => {
			if (!watchMainReady()) return;

			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
				throw new Meteor.Error('verify-email', 'E-mail not verified');
			} else {
				Tracker.nonreactive(() => {
					void sdk.call('afterVerifyEmail');
				});
				dispatchToastMessage({ type: 'success', message: t('Email_verified') });
			}
		});
	});
});
