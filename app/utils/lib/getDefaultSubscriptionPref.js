export const getDefaultSubscriptionPref = (userPref) => {
	const subscription = {};

	const {
		desktopNotifications,
		mobileNotifications,
		emailNotificationMode,
		audioNotifications,
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

	if (audioNotifications && audioNotifications !== 'default') {
		subscription.audioNotifications = audioNotifications;
		subscription.audioPrefOrigin = 'user';
	}

	return subscription;
};
