export const username = `user.test.${ Date.now() }`;
export const email = `${ username }@rocket.chat`;
export const password = 'rocket.chat';
export const reason = 'rocket.chat.reason';
export const adminUsername = 'rocketchat.internal.admin.test';
export const adminEmail = `${ adminUsername }@rocket.chat`;
export const adminPassword = adminUsername;
export const preferences = {
	data: {
		newRoomNotification: 'door',
		newMessageNotification: 'chime',
		muteFocusedConversations: true,
		clockMode: 0,
		useEmojis: true,
		convertAsciiEmoji: true,
		saveMobileBandwidth: true,
		collapseMediaByDefault: false,
		statusViewMode: 0,
		autoImageLoad: true,
		emailNotificationMode: 'mentions',
		unreadAlert: true,
		notificationsSoundVolume: 100,
		desktopNotifications: 'default',
		mobileNotifications: 'default',
		enableAutoAway: true,
		highlights: [],
		desktopNotificationDuration: 0,
		messageViewMode: 0,
		hideUsernames: false,
		hideRoles: false,
		hideAvatars: false,
		hideFlexTab: false,
		sendOnEnter: 'normal',
		roomCounterSidebar: false,
	},
};
