import { IUser } from "@rocket.chat/core-typings";

export const username = 'user.test';
export const email = `${username}@rocket.chat`;
export const password = 'rocket.chat';
export const reason = 'rocket.chat.reason';
export const adminUsername = 'rocketchat.internal.admin.test';
export const adminEmail = `${adminUsername}@rocket.chat`;
export const adminPassword = adminUsername;
export const preferences = {
	data: {
		newRoomNotification: 'door',
		newMessageNotification: 'chime',
		muteFocusedConversations: true,
		clockMode: 1,
		useEmojis: true,
		convertAsciiEmoji: true,
		saveMobileBandwidth: true,
		collapseMediaByDefault: false,
		autoImageLoad: true,
		emailNotificationMode: 'mentions',
		unreadAlert: true,
		notificationsSoundVolume: 100,
		desktopNotifications: 'default',
		pushNotifications: 'default',
		enableAutoAway: true,
		highlights: [],
		desktopNotificationRequireInteraction: false,
		hideUsernames: false,
		hideRoles: false,
		displayAvatars: true,
		hideFlexTab: false,
		sendOnEnter: 'normal',
		idleTimeLimit: 3600,
		notifyCalendarEvents: false,
		enableMobileRinging: false,
	},
};

export type IUserCredentialsHeader = { 'X-Auth-Token': string; 'X-User-Id': string; };

export type IUserWithCredentials = {
    user: IUser;
    credentials: IUserCredentialsHeader;
};
