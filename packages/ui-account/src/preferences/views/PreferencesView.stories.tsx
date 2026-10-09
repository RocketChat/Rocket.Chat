import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import PreferencesView from './PreferencesView';
import type { PreferencesViewModel } from '../logic/usePreferences';

const createViewModel = (overrides: Partial<PreferencesViewModel> = {}): PreferencesViewModel => ({
	values: {
		language: 'en',
		dontAskAgainList: ['delete-message'],
		enableAutoAway: true,
		idleTimeLimit: 300,
		desktopNotifications: 'default',
		pushNotifications: 'default',
		emailNotificationMode: 'mentions',
		receiveLoginDetectionEmail: true,
		unreadAlert: true,
		alsoSendThreadToChannel: 'default',
		useEmojis: true,
		convertAsciiEmoji: true,
		autoImageLoad: true,
		sendOnEnter: 'normal',
		highlights: 'release,\nincident',
		newRoomNotification: 'door',
		newMessageNotification: 'chime',
		masterVolume: 100,
		notificationsSoundVolume: 80,
		voipRingerVolume: 100,
	},
	dontAskAgainItems: [{ action: 'delete-message', label: 'Delete message' }],
	languages: [
		{ key: 'en', name: 'English' },
		{ key: 'pt-BR', name: 'Português (Brasil)' },
	],
	sounds: [
		{ _id: 'chime', name: 'Chime' },
		{ _id: 'door', name: 'Door' },
	],
	notifications: {
		defaultDesktop: 'all',
		defaultMobile: 'mentions',
		userEmailMode: 'mentions',
		canChangeEmailNotification: true,
		showNewLoginEmailPreference: true,
		showCalendarPreference: false,
		showMobileRinging: true,
	},
	dataDownloadEnabled: true,
	dataDownloadDialog: null,
	save: async () => undefined,
	requestDataDownload: async () => undefined,
	dismissDataDownloadDialog: () => undefined,
	sendTestNotification: () => undefined,
	...overrides,
});

const meta = {
	component: PreferencesView,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				'Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description': 'Allow users to select the also send to channel behavior',
				'Accounts_Default_User_Preferences_showThreadsInMainChannel_Description':
					"When enabled, all replies under a thread will also be displayed directly in the main room. When disabled, thread replies will be displayed based on the sender's choice.",
				'All_messages': 'All messages',
				'Also_send_thread_message_to_channel_behavior': 'Also send thread message to channel behavior',
				'Always_show_thread_replies_in_main_channel': 'Always show thread replies in main channel',
				'Auto_Load_Images': 'Auto load images',
				'Call_ringer_volume': 'Call ringer volume',
				'Call_ringer_volume_hint': 'For all incoming voice and video call notifications',
				'Cancel': 'Cancel',
				'Collapse_Embedded_Media_By_Default': 'Collapse embedded media by default',
				'Convert_Ascii_Emojis': 'Convert ASCII to emoji',
				'Default': 'Default',
				'Desktop_Notifications': 'Desktop notifications',
				'Desktop_Notifications_Disabled':
					'Desktop notifications are disabled. Change your browser preferences if you need notifications enabled.',
				'Display_avatars': 'Display avatars',
				'Dont_ask_me_again_list': "Don't ask me again list",
				'Download_My_Data': 'Download my data (HTML)',
				'Email_Notification_Mode': 'Offline email notifications',
				'Email_Notification_Mode_All': 'Every mention/DM',
				'Email_Notification_Mode_Disabled': 'Disabled',
				'Email_Notifications_Change_Disabled': 'Your Rocket.Chat administrator has disabled email notifications',
				'Enable_Auto_Away': 'Enable auto away',
				'Enable_Auto_Away_Description':
					'Switches your status to away after a period of inactivity. Has no effect if status is manually set to busy or away.',
				'Enable_Desktop_Notifications': 'Enable desktop notifications',
				'Enter_Alternative': 'Alternative mode (send with enter + ctrl/alt/shift/CMD)',
				'Enter_Behaviour': 'Enter key behavior',
				'Enter_Behaviour_Description': 'This changes if the enter key will send a message or do a line break',
				'Enter_Normal': 'Normal mode (send with enter)',
				'Export_My_Data': 'Export my data (JSON)',
				'Global': 'Global',
				'Go_to_accessibility_and_appearance': 'Go to accessibility and appearance',
				'Hide_flextab': 'Hide contextual bar by clicking outside of it',
				'Hide_roles': 'Hide roles',
				'Hide_usernames': 'Hide usernames',
				'Highlights': 'Highlights',
				'Highlights_How_To':
					'To be notified when someone mentions a word or phrase, add it here. You can separate words or phrases with commas. Highlight words are not case sensitive.',
				'Highlights_List': 'Highlight words',
				'Idle_Time_Limit': 'Idle time limit',
				'Idle_Time_Limit_Description':
					"Set how long (in seconds) the app waits before marking you as away when you're not active. Minimum: 60 seconds",
				'Language': 'Language',
				'Localization': 'Localization',
				'Master_volume': 'Master volume',
				'Master_volume_hint': 'Controls the volume for all sounds coming from your workspace',
				'Mentions': 'Mentions',
				'Message_TimeFormat': 'Time format',
				'Messages': 'Messages',
				'Mute_Focused_Conversations': 'Mute focused conversations',
				'My Data': 'My data',
				'New_Message_Notification': 'New message notification',
				'New_Room_Notification': 'New room notification',
				'Nothing': 'Nothing',
				'Nothing_found': 'Nothing found',
				'Notification_Desktop_Default_For': 'Show desktop notifications for',
				'Notification_Desktop_show_voice_calls': 'Show desktop notifications for voice calls',
				'Notification_Push_Default_For': 'Send push notifications for',
				'Notification_RequireInteraction': 'Require interaction to dismiss desktop notification',
				'Notification_volume': 'Notification volume',
				'Notification_volume_hint': 'For message notifications, both for when the workspace is open or not',
				'Notifications': 'Notifications',
				'Notify_Calendar_Events': 'Notify calendar events',
				'Ok': 'Ok',
				'Only_On_Desktop': 'Desktop mode (only sends with enter on desktop)',
				'Only_works_with_chrome_version_greater_50': 'Only works with Chrome browser versions > 50',
				'Preferences': 'Preferences',
				'Receive_Login_Detection_Emails': 'Receive login detection emails',
				'Receive_Login_Detection_Emails_Description': 'Receive an email each time a new login is detected on your account.',
				'Save_Mobile_Bandwidth': 'Save mobile bandwidth',
				'Save_changes': 'Save changes',
				'Selected_by_default': 'Selected by default',
				'Selected_first_reply_unselected_following_replies': 'Selected for first reply, unselected for following replies',
				'Sound': 'Sound',
				'Test_Desktop_Notifications': 'Test desktop notifications',
				'Unread_Tray_Icon_Alert': 'Unread tray icon alert',
				'Unselected_by_default': 'Unselected by default',
				'Use_Emojis': 'Use emojis',
				'UserDataDownload_CompletedRequestExistedWithLink_Text':
					'Your data file was already generated. Click <a href="{{download_link}}" target="_blank">here</a> to download it.',
				'UserDataDownload_CompletedRequestExisted_Text':
					'Your data file was already generated. Check your email account for the download link.',
				'UserDataDownload_RequestExisted_Text':
					'Your data file is already being generated. A link to download it will be sent to your email address when ready. There are <strong>{{pending_operations}}</strong> queued operations to run before yours.',
				'UserDataDownload_Requested': 'Download file requested',
				'UserDataDownload_Requested_Text':
					'Your data file will be generated. A link to download it will be sent to your email address when ready. There are <strong>{{pending_operations}}</strong> queued operations to run before yours.',
				'User_Presence': 'User presence',
				'VideoConf_Mobile_Ringing': 'Enable mobile ringing',
				'You_need_to_verifiy_your_email_address_to_get_notications': 'You need to verify your email address to get notifications',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof PreferencesView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { vm: createViewModel() },
};

export const RestrictedByWorkspace: Story = {
	args: {
		vm: createViewModel({
			notifications: {
				defaultDesktop: 'nothing',
				defaultMobile: 'nothing',
				userEmailMode: 'nothing',
				canChangeEmailNotification: false,
				showNewLoginEmailPreference: false,
				showCalendarPreference: false,
				showMobileRinging: false,
			},
			dataDownloadEnabled: false,
		}),
	},
};

export const DataDownloadRequested: Story = {
	args: { vm: createViewModel({ dataDownloadDialog: { type: 'requested', pendingOperations: 2 } }) },
};
