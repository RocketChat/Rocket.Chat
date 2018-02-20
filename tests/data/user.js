export const username = `user.test.${ Date.now() }`;
export const email = `${ username }@rocket.chat`;
export const password = 'rocket.chat';
export const adminUsername = 'rocketchat.internal.admin.test';
export const adminEmail = `${ adminUsername }@rocket.chat`;
export const adminPassword = adminUsername;
export const preferences = {
	data: {
		newRoomNotification: 'door',
		newMessageNotification: 'chime',
		muteFocusedConversations: true,
		useEmojis: true,
		convertAsciiEmoji: true,
		saveMobileBandwidth: true,
		collapseMediaByDefault: false,
		autoImageLoad: true,
		emailNotificationMode: 'all',
		roomsListExhibitionMode: 'category',
		unreadAlert: true,
		notificationsSoundVolume: 100,
		desktopNotifications: 'default',
		mobileNotifications: 'default',
		enableAutoAway: true,
		highlights: [],
		desktopNotificationDuration: 0,
		viewMode: 0,
		hideUsernames: false,
		hideRoles: false,
		hideAvatars: false,
		hideFlexTab: false,
		sendOnEnter: 'normal',
		roomCounterSidebar: false
	}
};
