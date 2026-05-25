import { Accounts } from 'meteor/accounts-base';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { t } from '../../../app/utils/lib/i18n';
import { PublicSettingsCachedStore, SubscriptionsCachedStore } from '../../cachedStores';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { setStorageBackend } from '../../lib/sdk/storage';
import { settings } from '../../lib/settings';
import { dispatchToastMessage } from '../../lib/toast';
import { userIdStore } from '../../lib/user';
import { useUserDataSyncReady } from '../../lib/userData';

// Meteor's accounts-password package registers `verifyEmail` server-side; declare
// it here so the typed `sdk.call` accepts it from client code.
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		verifyEmail(token: string): void;
	}
}

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

const FORGET_SESSION_SETTING_ID = 'Accounts_ForgetUserSessionOnWindowClose';

let configuredStorageBackend: 'local' | 'session' | undefined;

const configureAccountsStorage = (clientStorage: 'local' | 'session'): void => {
	(
		Accounts as unknown as {
			config: (options: { clientStorage: 'local' | 'session' }) => void;
		}
	).config({ clientStorage });
};

const applyForgetSessionOnWindowClose = (): void => {
	const storageBackend = settings.peek<boolean>(FORGET_SESSION_SETTING_ID) ? 'session' : 'local';

	if (configuredStorageBackend === storageBackend) {
		return;
	}

	setStorageBackend(storageBackend);
	configureAccountsStorage(storageBackend);
	configuredStorageBackend = storageBackend;
};

applyForgetSessionOnWindowClose();
settings.observe(FORGET_SESSION_SETTING_ID, applyForgetSessionOnWindowClose);
PublicSettingsCachedStore.useReady.subscribe(applyForgetSessionOnWindowClose);
userIdStore.subscribe(applyForgetSessionOnWindowClose);

getDdpSdk().account.onEmailVerificationLink(async (token: string) => {
	try {
		await sdk.call('verifyEmail', token);
		await whenMainReady();
		void sdk.call('afterVerifyEmail');
		dispatchToastMessage({ type: 'success', message: t('Email_verified') });
	} catch (error) {
		await whenMainReady();
		dispatchToastMessage({ type: 'error', message: error });
		throw new Error('verify-email: E-mail not verified', { cause: error });
	}
});
