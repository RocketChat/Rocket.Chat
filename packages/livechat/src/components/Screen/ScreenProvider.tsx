import type { FunctionalComponent } from 'preact';
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { parse } from 'query-string';

import { isActiveSession } from '../../helpers/isActiveSession';
import { loadConfig } from '../../lib/main';
import { parentCall } from '../../lib/parentCall';
import { loadMessages } from '../../lib/room';
import Triggers from '../../lib/triggers';
import { StoreContext } from '../../store';

export type ScreenContextValue = {
	hideWatermark: boolean;
	livechatLogo: { url: string } | undefined;
	notificationsEnabled: boolean;
	minimized: boolean;
	expanded: boolean;
	windowed: boolean;
	sound: unknown;
	alerts: unknown;
	modal: unknown;
	nameDefault: string;
	emailDefault: string;
	departmentDefault: string;
	onEnableNotifications: () => unknown;
	onDisableNotifications: () => unknown;
	onMinimize: () => unknown;
	onRestore: () => Promise<void>;
	onOpenWindow: () => unknown;
	onDismissAlert: () => unknown;
	dismissNotification: () => void;
	theme?: {
		color?: string;
		fontColor?: string;
		iconColor?: string;
		position?: 'left' | 'right';
		guestBubbleBackgroundColor?: string;
		agentBubbleBackgroundColor?: string;
		background?: string;
		hideGuestAvatar?: boolean;
		hideAgentAvatar?: boolean;
		hideExpandChat?: boolean;
	};
};

export const ScreenContext = createContext<ScreenContextValue>({
	theme: {
		color: '',
		fontColor: '',
		iconColor: '',
		hideAgentAvatar: false,
		hideGuestAvatar: true,
		hideExpandChat: false,
	},
	notificationsEnabled: true,
	minimized: true,
	windowed: false,
	onEnableNotifications: () => undefined,
	onDisableNotifications: () => undefined,
	onMinimize: () => undefined,
	onRestore: async () => undefined,
	onOpenWindow: () => undefined,
} as ScreenContextValue);

export const ScreenProvider: FunctionalComponent = ({ children }) => {
	const store = useContext(StoreContext);
	const { token, dispatch, config, sound, minimized = true, undocked, expanded = false, alerts, modal, iframe, customFieldsQueue } = store;
	const { department, name, email } = iframe.guest || {};
	const { color, position: configPosition, background, hideExpandChat } = config.theme || {};
	const { livechatLogo, hideWatermark = false } = config.settings || {};

	const {
		color: customColor,
		fontColor: customFontColor,
		iconColor: customIconColor,
		guestBubbleBackgroundColor,
		agentBubbleBackgroundColor,
		position: customPosition,
		background: customBackground,
		hideAgentAvatar = false,
		hideGuestAvatar = true,
		hideExpandChat: customHideExpandChat = false,
	} = iframe.theme || {};

	const [poppedOut, setPopedOut] = useState(false);

	const position = customPosition || configPosition || 'right';

	useEffect(() => {
		parentCall('setWidgetPosition', position || 'right');
	}, [position]);

	const handleEnableNotifications = () => {
		dispatch({ sound: { ...sound, enabled: true } });
	};

	const handleDisableNotifications = () => {
		dispatch({ sound: { ...sound, enabled: false } });
	};

	const handleMinimize = () => {
		parentCall('minimizeWindow');
		dispatch({ minimized: true });
	};

	const handleRestore = async () => {
		parentCall('restoreWindow');

		if (undocked) {
			// Cross-tab communication will not work here due cross origin (usually the widget parent and the RC server will have different urls)
			// So we manually update the widget to get the messages and actions done while undocked
			await loadConfig();
			await loadMessages();
		}

		dispatch({ minimized: false, undocked: false });

		Triggers.callbacks?.emit('chat-opened-by-visitor');
	};

	const handleOpenWindow = () => {
		parentCall('openPopout', { token, iframe, customFieldsQueue });
		dispatch({ undocked: true, minimized: false });
	};

	const handleDismissAlert = (id: string) => {
		dispatch({ alerts: alerts.filter((alert) => alert.id !== id) });
	};

	const dismissNotification = () => !isActiveSession();

	useEffect(() => {
		// Checking if the window is poppedOut and setting parent minimized if yes for the restore purpose
		const poppedOut = parse(window.location.search).mode === 'popout';
		setPopedOut(poppedOut);
		if (poppedOut) {
			dispatch({ minimized: false, undocked: true });
		}
	}, [dispatch]);

	const screenProps = {
		theme: {
			color: customColor || color,
			fontColor: customFontColor,
			iconColor: customIconColor,
			position,
			guestBubbleBackgroundColor,
			agentBubbleBackgroundColor,
			background: customBackground || background,
			hideAgentAvatar,
			hideGuestAvatar,
			hideExpandChat: customHideExpandChat || hideExpandChat,
		},
		notificationsEnabled: sound?.enabled,
		minimized: !poppedOut && (minimized || undocked),
		expanded: !minimized && expanded,
		windowed: poppedOut,
		livechatLogo,
		hideWatermark,
		sound,
		alerts,
		modal,
		nameDefault: name,
		emailDefault: email,
		departmentDefault: department,
		onEnableNotifications: handleEnableNotifications,
		onDisableNotifications: handleDisableNotifications,
		onMinimize: handleMinimize,
		onRestore: handleRestore,
		onOpenWindow: handleOpenWindow,
		onDismissAlert: handleDismissAlert,
		dismissNotification,
	};

	return <ScreenContext.Provider value={screenProps}>{children}</ScreenContext.Provider>;
};
