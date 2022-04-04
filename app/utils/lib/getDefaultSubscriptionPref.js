export const getDefaultSubscriptionPref = (userPref) => {
	const subscription = {};

	const { desktopNotifications, pushNotifications, emailNotificationMode, highlights } =
		(userPref.settings && userPref.settings.preferences) || {};

	if (Array.isArray(highlights) && highlights.length) {
		subscription.userHighlights = highlights;
	}

	if (desktopNotifications && desktopNotifications !== 'default') {
		subscription.desktopNotifications = desktopNotifications;
		subscription.desktopPrefOrigin = 'user';
	}

	if (pushNotifications && pushNotifications !== 'default') {
		subscription.mobilePushNotifications = pushNotifications;
		subscription.mobilePrefOrigin = 'user';
	}

	if (emailNotificationMode && emailNotificationMode !== 'default') {
		subscription.emailNotifications = emailNotificationMode;
		subscription.emailPrefOrigin = 'user';
	}

	return subscription;
};
