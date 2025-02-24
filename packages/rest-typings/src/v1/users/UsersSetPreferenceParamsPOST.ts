import type { ThemePreference } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});
export type FontSize = '100%' | '14px' | '18px' | '20px' | '24px';

export type UsersSetPreferencesParamsPOST = {
	userId?: string;
	data: {
		newRoomNotification?: string;
		newMessageNotification?: string;
		clockMode?: number;
		useEmojis?: boolean;
		convertAsciiEmoji?: boolean;
		saveMobileBandwidth?: boolean;
		collapseMediaByDefault?: boolean;
		autoImageLoad?: boolean;
		emailNotificationMode?: string;
		unreadAlert?: boolean;
		masterVolume?: number;
		notificationsSoundVolume?: number;
		voipRingerVolume?: number;
		desktopNotifications?: string;
		pushNotifications?: string;
		enableAutoAway?: boolean;
		highlights?: string[];
		alsoSendThreadToChannel?: 'never' | 'always' | 'default';
		desktopNotificationRequireInteraction?: boolean;
		showThreadsInMainChannel?: boolean;
		hideUsernames?: boolean;
		hideRoles?: boolean;
		displayAvatars?: boolean;
		hideFlexTab?: boolean;
		sendOnEnter?: string;
		language?: string;
		sidebarShowFavorites?: boolean;
		sidebarShowUnread?: boolean;
		sidebarSortby?: string;
		sidebarViewMode?: string;
		sidebarDisplayAvatar?: boolean;
		sidebarGroupByType?: boolean;
		muteFocusedConversations?: boolean;
		dontAskAgainList?: Array<{ action: string; label: string }>;
		featuresPreview?: { name: string; value: boolean }[];
		themeAppearence?: ThemePreference;
		fontSize?: FontSize;
		receiveLoginDetectionEmail?: boolean;
		notifyCalendarEvents?: boolean;
		idleTimeLimit?: number;
		omnichannelTranscriptEmail?: boolean;
		omnichannelTranscriptPDF?: boolean;
		omnichannelHideConversationAfterClosing?: boolean;
		enableMobileRinging?: boolean;
		mentionsWithSymbol?: boolean;
	};
};

const UsersSetPreferencesParamsPostSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: true,
		},
		data: {
			type: 'object',
			properties: {
				newRoomNotification: {
					type: 'string',
					nullable: true,
				},
				newMessageNotification: {
					type: 'string',
					nullable: true,
				},
				clockMode: {
					type: 'number',
					nullable: true,
				},
				useEmojis: {
					type: 'boolean',
					nullable: true,
				},
				convertAsciiEmoji: {
					type: 'boolean',
					nullable: true,
				},
				alsoSendThreadToChannel: {
					type: 'string',
					enum: ['default', 'always', 'never'],
					nullable: true,
				},
				saveMobileBandwidth: {
					type: 'boolean',
					nullable: true,
				},
				collapseMediaByDefault: {
					type: 'boolean',
					nullable: true,
				},
				autoImageLoad: {
					type: 'boolean',
					nullable: true,
				},
				emailNotificationMode: {
					type: 'string',
					nullable: true,
				},
				unreadAlert: {
					type: 'boolean',
					nullable: true,
				},
				masterVolume: {
					type: 'number',
					nullable: true,
				},
				notificationsSoundVolume: {
					type: 'number',
					nullable: true,
				},
				voipRingerVolume: {
					type: 'number',
					nullable: true,
				},
				desktopNotifications: {
					type: 'string',
					nullable: true,
				},
				pushNotifications: {
					type: 'string',
					nullable: true,
				},
				enableAutoAway: {
					type: 'boolean',
					nullable: true,
				},
				highlights: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				showThreadsInMainChannel: {
					type: 'boolean',
					nullable: true,
				},
				desktopNotificationRequireInteraction: {
					type: 'boolean',
					nullable: true,
				},
				hideUsernames: {
					type: 'boolean',
					nullable: true,
				},
				hideRoles: {
					type: 'boolean',
					nullable: true,
				},
				displayAvatars: {
					type: 'boolean',
					nullable: true,
				},
				hideFlexTab: {
					type: 'boolean',
					nullable: true,
				},
				sendOnEnter: {
					type: 'string',
					nullable: true,
				},
				language: {
					type: 'string',
					nullable: true,
				},
				sidebarShowFavorites: {
					type: 'boolean',
					nullable: true,
				},
				sidebarShowUnread: {
					type: 'boolean',
					nullable: true,
				},
				sidebarSortby: {
					type: 'string',
					nullable: true,
				},
				sidebarViewMode: {
					type: 'string',
					nullable: true,
				},
				sidebarDisplayAvatar: {
					type: 'boolean',
					nullable: true,
				},
				sidebarGroupByType: {
					type: 'boolean',
					nullable: true,
				},
				muteFocusedConversations: {
					type: 'boolean',
					nullable: true,
				},
				dontAskAgainList: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							action: { type: 'string' },
							label: { type: 'string' },
						},
					},
					nullable: true,
				},
				featuresPreview: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							value: { type: 'boolean' },
						},
					},
					nullable: true,
				},
				themeAppearence: {
					type: 'string',
					nullable: true,
				},
				fontSize: {
					type: 'string',
					nullable: true,
				},
				receiveLoginDetectionEmail: {
					type: 'boolean',
					nullable: true,
				},
				notifyCalendarEvents: {
					type: 'boolean',
					nullable: true,
				},
				idleTimeLimit: {
					type: 'number',
					nullable: true,
				},
				omnichannelTranscriptEmail: {
					type: 'boolean',
					nullable: true,
				},
				omnichannelTranscriptPDF: {
					type: 'boolean',
					nullable: true,
				},
				omnichannelHideConversationAfterClosing: {
					type: 'boolean',
					nullable: true,
				},
				enableMobileRinging: {
					type: 'boolean',
					nullable: true,
				},
				mentionsWithSymbol: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: [],
			additionalProperties: false,
		},
	},
	required: ['data'],
	additionalProperties: false,
};

export const isUsersSetPreferencesParamsPOST = ajv.compile<UsersSetPreferencesParamsPOST>(UsersSetPreferencesParamsPostSchema);
