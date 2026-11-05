import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useCustomSound,
	useEndpoint,
	useLanguages,
	useSetting,
	useToastMessageDispatch,
	useUser,
	useUserPreference,
} from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DontAskAgainItem } from './preferencesPayload';
import { toPreferencesPayload } from './preferencesPayload';

export type AccountPreferencesData = {
	language?: string;
	dontAskAgainList?: string[];
	enableAutoAway?: boolean;
	idleTimeLimit?: number;
	desktopNotificationRequireInteraction?: boolean;
	desktopNotifications?: string;
	pushNotifications?: string;
	emailNotificationMode?: string;
	receiveLoginDetectionEmail?: boolean;
	notifyCalendarEvents?: boolean;
	enableMobileRinging?: boolean;
	unreadAlert?: boolean;
	showThreadsInMainChannel?: boolean;
	alsoSendThreadToChannel?: 'default' | 'always' | 'never';
	useEmojis?: boolean;
	convertAsciiEmoji?: boolean;
	autoImageLoad?: boolean;
	saveMobileBandwidth?: boolean;
	collapseMediaByDefault?: boolean;
	hideFlexTab?: boolean;
	sendOnEnter?: 'normal' | 'alternative' | 'desktop';
	highlights?: string;
	newRoomNotification?: string;
	newMessageNotification?: string;
	muteFocusedConversations?: boolean;

	enableNewMessageTemplate?: boolean;
	displayAvatars?: boolean;
	sidebarShowFavorites?: boolean;
	sidebarShowUnread?: boolean;
	sidebarSortby?: string;
	sidebarViewMode?: string;
	sidebarDisplayAvatar?: boolean;
	sidebarGroupByType?: boolean;
	masterVolume?: number;
	notificationsSoundVolume?: number;
	voipRingerVolume?: number;
	desktopNotificationVoiceCalls?: boolean;
};

const usePreferencesValues = (): AccountPreferencesData => {
	const language = useUserPreference<string>('language') || '';
	const userDontAskAgainList = useUserPreference<DontAskAgainItem[]>('dontAskAgainList') || [];
	const dontAskAgainList = userDontAskAgainList.map(({ action }) => action);
	const enableAutoAway = useUserPreference<boolean>('enableAutoAway');
	const idleTimeLimit = useUserPreference<number>('idleTimeLimit');

	const desktopNotificationRequireInteraction = useUserPreference<boolean>('desktopNotificationRequireInteraction');
	const desktopNotifications = useUserPreference<string>('desktopNotifications');
	const pushNotifications = useUserPreference<string>('pushNotifications');
	const emailNotificationMode = useUserPreference<string>('emailNotificationMode');
	const receiveLoginDetectionEmail = useUserPreference<boolean>('receiveLoginDetectionEmail', true);
	const notifyCalendarEvents = useUserPreference<boolean>('notifyCalendarEvents');
	const enableMobileRinging = useUserPreference<boolean>('enableMobileRinging');

	const unreadAlert = useUserPreference<boolean>('unreadAlert');
	const showThreadsInMainChannel = useUserPreference<boolean>('showThreadsInMainChannel');
	const alsoSendThreadToChannel = useUserPreference<'default' | 'always' | 'never'>('alsoSendThreadToChannel');
	const useEmojis = useUserPreference<boolean>('useEmojis');
	const convertAsciiEmoji = useUserPreference<boolean>('convertAsciiEmoji');
	const autoImageLoad = useUserPreference<boolean>('autoImageLoad');
	const saveMobileBandwidth = useUserPreference<boolean>('saveMobileBandwidth');
	const collapseMediaByDefault = useUserPreference<boolean>('collapseMediaByDefault');
	const hideFlexTab = useUserPreference<boolean>('hideFlexTab');
	const sendOnEnter = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	const highlights = useUserPreference<string[]>('highlights')?.join(',\n') ?? '';

	const newRoomNotification = useUserPreference<string>('newRoomNotification');
	const newMessageNotification = useUserPreference<string>('newMessageNotification');
	const muteFocusedConversations = useUserPreference<boolean>('muteFocusedConversations');

	const masterVolume = useUserPreference<number>('masterVolume', 100);
	const notificationsSoundVolume = useUserPreference<number>('notificationsSoundVolume', 100);
	const voipRingerVolume = useUserPreference<number>('voipRingerVolume', 100);

	const desktopNotificationVoiceCalls = useUserPreference<boolean>('desktopNotificationVoiceCalls');

	return {
		language,
		dontAskAgainList,
		enableAutoAway,
		idleTimeLimit,
		desktopNotificationRequireInteraction,
		desktopNotifications,
		pushNotifications,
		emailNotificationMode,
		receiveLoginDetectionEmail,
		notifyCalendarEvents,
		enableMobileRinging,
		unreadAlert,
		showThreadsInMainChannel,
		alsoSendThreadToChannel,
		useEmojis,
		convertAsciiEmoji,
		autoImageLoad,
		saveMobileBandwidth,
		collapseMediaByDefault,
		hideFlexTab,
		sendOnEnter,
		displayAvatars,
		highlights,
		newRoomNotification,
		newMessageNotification,
		muteFocusedConversations,
		masterVolume,
		notificationsSoundVolume,
		voipRingerVolume,
		desktopNotificationVoiceCalls,
	};
};

export type NotificationOption = 'all' | 'mentions' | 'nothing';

export type EmailNotificationOption = 'mentions' | 'nothing';

export type DataDownloadDialog =
	| { type: 'requested'; pendingOperations: number }
	| { type: 'already-requested'; pendingOperations: number }
	| { type: 'completed'; url?: string }
	| { type: 'acknowledged' };

export type PreferencesViewModel = {
	values: AccountPreferencesData;
	dontAskAgainItems: DontAskAgainItem[];
	languages: { key: string; name: string }[];
	sounds: { _id: string; name: string }[];
	notifications: {
		defaultDesktop: NotificationOption;
		defaultMobile: NotificationOption;
		userEmailMode: EmailNotificationOption;
		canChangeEmailNotification: boolean;
		showNewLoginEmailPreference: boolean;
		showCalendarPreference: boolean;
		showMobileRinging: boolean;
	};
	dataDownloadEnabled: boolean;
	dataDownloadDialog: DataDownloadDialog | null;
	save: (changes: Partial<AccountPreferencesData>) => Promise<void>;
	requestDataDownload: (fullExport: boolean) => Promise<void>;
	dismissDataDownloadDialog: () => void;
	sendTestNotification: () => void;
};

export type UsePreferencesOptions = {
	/** Shows a desktop notification through the host app; the package cannot reach the notification runtime itself. */
	sendTestNotification: () => void;
};

export const usePreferences = ({ sendTestNotification }: UsePreferencesOptions): PreferencesViewModel => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const values = usePreferencesValues();
	const dontAskAgainItems = useUserPreference<DontAskAgainItem[]>('dontAskAgainList') || [];
	const languages = useLanguages();
	const { list: sounds } = useCustomSound();

	const defaultDesktop = useSetting('Accounts_Default_User_Preferences_desktopNotifications') as NotificationOption;
	const defaultMobile = useSetting('Accounts_Default_User_Preferences_pushNotifications') as NotificationOption;
	const userEmailMode = useUserPreference('emailNotificationMode') as EmailNotificationOption;
	const canChangeEmailNotification = useSetting('Accounts_AllowEmailNotifications', false);
	const loginEmailEnabled = useSetting('Device_Management_Enable_Login_Emails', false);
	const allowLoginEmailPreference = useSetting('Device_Management_Allow_Login_Email_preference', false);
	const showVideoConfMobileRinging = useSetting('VideoConf_Mobile_Ringing', false);
	const showVoipMobileRinging = useSetting('VoIP_TeamCollab_Mobile_Ringing_Enabled', false);
	const dataDownloadEnabled = useSetting('UserData_EnableDownload', false);

	const setPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const requestDownload = useEndpoint('GET', '/v1/users.requestDataDownload');
	const [dataDownloadDialog, setDataDownloadDialog] = useState<DataDownloadDialog | null>(null);

	const save = useStableCallback(async (changes: Partial<AccountPreferencesData>) => {
		try {
			await setPreferences({ data: toPreferencesPayload(changes, dontAskAgainItems) });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const requestDataDownload = useStableCallback(async (fullExport: boolean) => {
		try {
			const result = await requestDownload({ fullExport: fullExport ? 'true' : 'false' });

			if (result.requested) {
				setDataDownloadDialog({ type: 'requested', pendingOperations: result.pendingOperationsBeforeMyRequest });
				return;
			}

			if (result.exportOperation?.status === 'completed') {
				setDataDownloadDialog({ type: 'completed', url: result.url ?? undefined });
				return;
			}

			if (result.exportOperation) {
				setDataDownloadDialog({ type: 'already-requested', pendingOperations: result.pendingOperationsBeforeMyRequest });
				return;
			}

			setDataDownloadDialog({ type: 'acknowledged' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const dismissDataDownloadDialog = useStableCallback(() => setDataDownloadDialog(null));

	return {
		values,
		dontAskAgainItems,
		languages,
		sounds,
		notifications: {
			defaultDesktop,
			defaultMobile,
			userEmailMode,
			canChangeEmailNotification,
			showNewLoginEmailPreference: loginEmailEnabled && allowLoginEmailPreference,
			showCalendarPreference: Boolean(user?.settings?.calendar?.outlook?.Enabled),
			showMobileRinging: showVideoConfMobileRinging || showVoipMobileRinging,
		},
		dataDownloadEnabled,
		dataDownloadDialog,
		save,
		requestDataDownload,
		dismissDataDownloadDialog,
		sendTestNotification,
	};
};
