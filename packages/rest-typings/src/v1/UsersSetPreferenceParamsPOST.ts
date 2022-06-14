import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersSetPreferencesParamsPOST = {
	userId: string;
	data: {
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
		desktopNotificationRequireInteraction: boolean;
		messageViewMode: number;
		showMessageInMainThread: boolean;
		hideUsernames: boolean;
		hideRoles: boolean;
		displayAvatars: boolean;
		hideFlexTab: boolean;
		sendOnEnter: string;
		language: string;
		sidebarShowFavorites?: boolean;
		sidebarShowUnread?: boolean;
		sidebarSortby?: string;
		sidebarViewMode?: string;
		sidebarDisplayAvatar?: boolean;
		sidebarGroupByType?: boolean;
		muteFocusedConversations?: boolean;
	};
};

const UsersSetPreferencesParamsPostSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		data: {
			type: 'object',
			properties: {
				newRoomNotification: {
					type: 'string',
				},
				newMessageNotification: {
					type: 'string',
				},
				clockMode: {
					type: 'number',
				},
				useEmojis: {
					type: 'boolean',
				},
				convertAsciiEmoji: {
					type: 'boolean',
				},
				saveMobileBandwidth: {
					type: 'boolean',
				},
				collapseMediaByDefault: {
					type: 'boolean',
				},
				autoImageLoad: {
					type: 'boolean',
				},
				emailNotificationMode: {
					type: 'string',
				},
				unreadAlert: {
					type: 'boolean',
				},
				notificationsSoundVolume: {
					type: 'number',
				},
				desktopNotifications: {
					type: 'string',
				},
				pushNotifications: {
					type: 'string',
				},
				enableAutoAway: {
					type: 'boolean',
				},
				highlights: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				desktopNotificationRequireInteraction: {
					type: 'boolean',
				},
				messageViewMode: {
					type: 'number',
				},
				showMessageInMainThread: {
					type: 'boolean',
				},
				hideUsernames: {
					type: 'boolean',
				},
				hideRoles: {
					type: 'boolean',
				},
				displayAvatars: {
					type: 'boolean',
				},
				hideFlexTab: {
					type: 'boolean',
				},
				sendOnEnter: {
					type: 'string',
				},
				language: {
					type: 'string',
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
			},
			required: [
				'newRoomNotification',
				'newMessageNotification',
				'clockMode',
				'useEmojis',
				'convertAsciiEmoji',
				'saveMobileBandwidth',
				'collapseMediaByDefault',
				'autoImageLoad',
				'emailNotificationMode',
				'unreadAlert',
				'notificationsSoundVolume',
				'desktopNotifications',
				'pushNotifications',
				'enableAutoAway',
				'highlights',
				'desktopNotificationRequireInteraction',
				'messageViewMode',
				'showMessageInMainThread',
				'hideUsernames',
				'hideRoles',
				'displayAvatars',
				'hideFlexTab',
				'sendOnEnter',
				'language',
			],
			additionalProperties: false,
		},
	},
	required: ['userId', 'data'],
	additionalProperties: false,
};

export const isUsersSetPreferencesParamsPOST = ajv.compile<UsersSetPreferencesParamsPOST>(UsersSetPreferencesParamsPostSchema);
