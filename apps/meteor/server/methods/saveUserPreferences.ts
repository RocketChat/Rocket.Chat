import type { ISubscription, ThemePreference } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Users } from '@rocket.chat/models';
import type { FontSize } from '@rocket.chat/rest-typings';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import {
	notifyOnSubscriptionChangedByAutoTranslateAndUserId,
	notifyOnSubscriptionChangedByUserId,
	notifyOnSubscriptionChangedByUserPreferences,
	notifyOnUserChange,
} from '../../app/lib/server/lib/notifyListener';
import { settings as rcSettings } from '../../app/settings/server';

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
	enableMobileRinging: boolean;
	mentionsWithSymbol?: boolean;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveUserPreferences(preferences: Partial<UserPreferences>): boolean;
	}
}

async function updateNotificationPreferences(
	userId: ISubscription['u']['_id'],
	setting: keyof ISubscription,
	newValue: string,
	oldValue: string,
	preferenceType: keyof ISubscription,
) {
	if (newValue === oldValue) {
		return;
	}

	if (newValue === 'default') {
		const clearNotificationResponse = await Subscriptions.clearNotificationUserPreferences(userId, setting, preferenceType);
		if (clearNotificationResponse.modifiedCount) {
			void notifyOnSubscriptionChangedByUserPreferences(userId, preferenceType, 'user');
		}
		return;
	}

	const updateNotificationResponse = await Subscriptions.updateNotificationUserPreferences(userId, newValue, setting, preferenceType);
	if (updateNotificationResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByUserPreferences(userId, preferenceType, 'subscription');
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
		omnichannelHideConversationAfterClosing: Match.Optional(Boolean),
		notifyCalendarEvents: Match.Optional(Boolean),
		enableMobileRinging: Match.Optional(Boolean),
		mentionsWithSymbol: Match.Optional(Boolean),
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
		language: oldLanguage,
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

	const diff = (Object.keys(settings) as (keyof UserPreferences)[]).reduce<Record<string, any>>((data, key) => {
		data[`settings.preferences.${key}`] = settings[key];

		return data;
	}, {});

	void notifyOnUserChange({
		id: user._id,
		clientAction: 'updated',
		diff: {
			...diff,
			...(settings.language != null && { language: settings.language }),
		},
	});

	// propagate changed notification preferences
	setImmediate(async () => {
		const { desktopNotifications, pushNotifications, emailNotificationMode, highlights, language } = settings;
		const promises = [];

		if (desktopNotifications) {
			promises.push(
				updateNotificationPreferences(user._id, 'desktopNotifications', desktopNotifications, oldDesktopNotifications, 'desktopPrefOrigin'),
			);
		}

		if (pushNotifications) {
			promises.push(
				updateNotificationPreferences(user._id, 'mobilePushNotifications', pushNotifications, oldMobileNotifications, 'mobilePrefOrigin'),
			);
		}

		if (emailNotificationMode) {
			promises.push(
				updateNotificationPreferences(user._id, 'emailNotifications', emailNotificationMode, oldEmailNotifications, 'emailPrefOrigin'),
			);
		}

		await Promise.allSettled(promises);

		if (Array.isArray(highlights)) {
			const response = await Subscriptions.updateUserHighlights(user._id, highlights);
			if (response.modifiedCount) {
				void notifyOnSubscriptionChangedByUserId(user._id);
			}
		}

		if (language && oldLanguage !== language && rcSettings.get('AutoTranslate_AutoEnableOnJoinRoom')) {
			const response = await Subscriptions.updateAllAutoTranslateLanguagesByUserId(user._id, language);
			if (response.modifiedCount) {
				void notifyOnSubscriptionChangedByAutoTranslateAndUserId(user._id);
			}
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
