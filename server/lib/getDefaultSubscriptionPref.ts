import { IUserSettings } from '../../definition/IUser';

type DefaultSubscriptionPref = {
	userHighlights?: string[];
	desktopNotifications?: unknown;
	desktopPrefOrigin?: 'user' | 'subscription';
	mobilePushNotifications?: unknown;
	mobilePrefOrigin?: 'user' | 'subscription';
	emailNotifications?: unknown;
	emailPrefOrigin?: 'user' | 'subscription';
};

export const getDefaultSubscriptionPref = (userPref: IUserSettings['preferences']): DefaultSubscriptionPref => {
	const subscription: DefaultSubscriptionPref = {};

	const {
		desktopNotifications,
		mobileNotifications,
		emailNotificationMode,
		highlights,
	} = (userPref.settings && userPref.settings.preferences) || {};

	if (Array.isArray(highlights) && highlights.length) {
		subscription.userHighlights = highlights;
	}

	if (desktopNotifications && desktopNotifications !== 'default') {
		subscription.desktopNotifications = desktopNotifications;
		subscription.desktopPrefOrigin = 'user';
	}

	if (mobileNotifications && mobileNotifications !== 'default') {
		subscription.mobilePushNotifications = mobileNotifications;
		subscription.mobilePrefOrigin = 'user';
	}

	if (emailNotificationMode && emailNotificationMode !== 'default') {
		subscription.emailNotifications = emailNotificationMode;
		subscription.emailPrefOrigin = 'user';
	}

	return subscription;
};
