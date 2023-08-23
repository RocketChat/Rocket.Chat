import { Subscriptions, Users } from '@rocket.chat/models';
import type { FontSize } from '@rocket.chat/rest-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

type UserPreferences = {
	language: string;
	newRoomNotification: string;
	newMessageNotification: string;
	clockMode: number;
	useEmojis: boolean;
	convertAsciiEmoji: boolean;
	saveMobileBandwidth: boolean;
	collapseMediaByDefault: boolean;
	autoImageLoad: boolean;
	emailNotificationMode: string;
	unreadAlert: boolean;
	notificationsSoundVolume: number;
	desktopNotifications: string;
	pushNotifications: string;
	enableAutoAway: boolean;
	highlights: string[];
	hideUsernames: boolean;
	hideRoles: boolean;
	displayAvatars: boolean;
	hideFlexTab: boolean;
	sendOnEnter: string;
	idleTimeLimit: number;
	sidebarShowFavorites: boolean;
	sidebarShowUnread: boolean;
	sidebarSortby: string;
	sidebarViewMode: string;
	sidebarDisplayAvatar: boolean;
	sidebarGroupByType: boolean;
	muteFocusedConversations: boolean;
	dontAskAgainList: { action: string; label: string }[];
	themeAppearence: ThemePreference;
	fontSize?: FontSize;
	receiveLoginDetectionEmail: boolean;
	notifyCalendarEvents: boolean;
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveUserPreferences(preferences: Partial<UserPreferences>): boolean;
	}
}

export const saveUserPreferences = async (settings: Partial<UserPreferences>, userId: string): Promise<void> => {
	const keys = {
		language: Match.Optional(String),
		newRoomNotification: Match.Optional(String),
		newMessageNotification: Match.Optional(String),
		clockMode: Match.Optional(Number),
		useEmojis: Match.Optional(Boolean),
		convertAsciiEmoji: Match.Optional(Boolean),
		saveMobileBandwidth: Match.Optional(Boolean),
		collapseMediaByDefault: Match.Optional(Boolean),
		autoImageLoad: Match.Optional(Boolean),
		emailNotificationMode: Match.Optional(String),
		unreadAlert: Match.Optional(Boolean),
		notificationsSoundVolume: Match.Optional(Number),
		desktopNotifications: Match.Optional(String),
		pushNotifications: Match.Optional(String),
		enableAutoAway: Match.Optional(Boolean),
		highlights: Match.Optional([String]),
		hideUsernames: Match.Optional(Boolean),
		hideRoles: Match.Optional(Boolean),
		displayAvatars: Match.Optional(Boolean),
		hideFlexTab: Match.Optional(Boolean),
		sendOnEnter: Match.Optional(String),
		idleTimeLimit: Match.Optional(Number),
		sidebarShowFavorites: Match.Optional(Boolean),
		sidebarShowUnread: Match.Optional(Boolean),
		sidebarSortby: Match.Optional(String),
		sidebarViewMode: Match.Optional(String),
		sidebarDisplayAvatar: Match.Optional(Boolean),
		sidebarGroupByType: Match.Optional(Boolean),
		muteFocusedConversations: Match.Optional(Boolean),
		themeAppearence: Match.Optional(String),
		fontSize: Match.Optional(String),
		omnichannelTranscriptEmail: Match.Optional(Boolean),
		omnichannelTranscriptPDF: Match.Optional(Boolean),
		notifyCalendarEvents: Match.Optional(Boolean),
	};
	check(settings, Match.ObjectIncluding(keys));
	const user = await Users.findOneById(userId);

	if (!user) {
		return;
	}

	const {
		desktopNotifications: oldDesktopNotifications,
		pushNotifications: oldMobileNotifications,
		emailNotificationMode: oldEmailNotifications,
	} = user.settings?.preferences || {};

	if (user.settings == null) {
		await Users.clearSettings(user._id);
	}

	if (settings.language != null) {
		await Users.setLanguage(user._id, settings.language);
	}

	// Keep compatibility with old values
	if (settings.emailNotificationMode === 'all') {
		settings.emailNotificationMode = 'mentions';
	} else if (settings.emailNotificationMode === 'disabled') {
		settings.emailNotificationMode = 'nothing';
	}

	if (settings.idleTimeLimit != null && settings.idleTimeLimit < 60) {
		throw new Meteor.Error('invalid-idle-time-limit-value', 'Invalid idleTimeLimit');
	}

	await Users.setPreferences(user._id, settings);

	// propagate changed notification preferences
	setImmediate(async () => {
		if (settings.desktopNotifications && oldDesktopNotifications !== settings.desktopNotifications) {
			if (settings.desktopNotifications === 'default') {
				await Subscriptions.clearNotificationUserPreferences(user._id, 'desktopNotifications', 'desktopPrefOrigin');
			} else {
				await Subscriptions.updateNotificationUserPreferences(
					user._id,
					settings.desktopNotifications,
					'desktopNotifications',
					'desktopPrefOrigin',
				);
			}
		}

		if (settings.pushNotifications && oldMobileNotifications !== settings.pushNotifications) {
			if (settings.pushNotifications === 'default') {
				await Subscriptions.clearNotificationUserPreferences(user._id, 'mobilePushNotifications', 'mobilePrefOrigin');
			} else {
				await Subscriptions.updateNotificationUserPreferences(
					user._id,
					settings.pushNotifications,
					'mobilePushNotifications',
					'mobilePrefOrigin',
				);
			}
		}

		if (settings.emailNotificationMode && oldEmailNotifications !== settings.emailNotificationMode) {
			if (settings.emailNotificationMode === 'default') {
				await Subscriptions.clearNotificationUserPreferences(user._id, 'emailNotifications', 'emailPrefOrigin');
			} else {
				await Subscriptions.updateNotificationUserPreferences(
					user._id,
					settings.emailNotificationMode,
					'emailNotifications',
					'emailPrefOrigin',
				);
			}
		}

		if (Array.isArray(settings.highlights)) {
			await Subscriptions.updateUserHighlights(user._id, settings.highlights);
		}
	});
};

Meteor.methods<ServerMethods>({
	async saveUserPreferences(settings) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveUserPreferences' });
		}

		await saveUserPreferences(settings, userId);

		return true;
	},
});
