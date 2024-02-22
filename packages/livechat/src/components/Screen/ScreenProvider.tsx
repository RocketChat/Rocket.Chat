import type { FunctionalComponent } from 'preact';
import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';
import { parse } from 'query-string';

import { isActiveSession } from '../../helpers/isActiveSession';
import { parentCall } from '../../lib/parentCall';
import Triggers from '../../lib/triggers';
import store, { StoreContext } from '../../store';

export type ScreenContextValue = {
	hideWatermark: boolean;
	logoUrl: string;
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
	onRestore: () => unknown;
	onOpenWindow: () => unknown;
	onDismissAlert: () => unknown;
	dismissNotification: () => void;
	theme?: {
		color: string;
		fontColor: string;
		iconColor: string;
	};
};

export const ScreenContext = createContext<ScreenContextValue>({
	theme: {
		color: '',
		fontColor: '',
		iconColor: '',
	},
	notificationsEnabled: true,
	minimized: true,
	windowed: false,
	onEnableNotifications: () => undefined,
	onDisableNotifications: () => undefined,
	onMinimize: () => undefined,
	onRestore: () => undefined,
	onOpenWindow: () => undefined,
} as ScreenContextValue);

export const ScreenProvider: FunctionalComponent = ({ children }) => {
	const { dispatch, config, sound, minimized = true, undocked, expanded = false, alerts, modal, iframe } = useContext(StoreContext);
	const { department, name, email } = iframe.guest || {};
	const { color } = config.theme || {};
	const { color: customColor, fontColor: customFontColor, iconColor: customIconColor } = iframe.theme || {};
	const { logoUrl, hideWatermark = false } = config.settings || {};

	const [poppedOut, setPopedOut] = useState(false);

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

	const handleRestore = () => {
		parentCall('restoreWindow');
		const dispatchRestore = () => dispatch({ minimized: false, undocked: false });

		const dispatchEvent = () => {
			dispatchRestore();
			store.off('storageSynced', dispatchEvent);
		};

		if (undocked) {
			store.on('storageSynced', dispatchEvent);
		} else {
			dispatchRestore();
		}

		Triggers.callbacks?.emit('chat-opened-by-visitor');
	};

	const handleOpenWindow = () => {
		parentCall('openPopout');
		dispatch({ undocked: true, minimized: false });
	};

	const handleDismissAlert = (id: string) => {
		dispatch({ alerts: alerts.filter((alert) => alert.id !== id) });
	};

	const dismissNotification = () => !isActiveSession();

	const checkPoppedOutWindow = useCallback(() => {
		// Checking if the window is poppedOut and setting parent minimized if yes for the restore purpose
		const poppedOut = parse(window.location.search).mode === 'popout';
		setPopedOut(poppedOut);

		if (poppedOut) {
			dispatch({ minimized: false });
		}
	}, [dispatch]);

	useEffect(() => {
		checkPoppedOutWindow();
	}, [checkPoppedOutWindow]);

	const screenProps = {
		theme: {
			color: customColor || color,
			fontColor: customFontColor,
			iconColor: customIconColor,
		},
		notificationsEnabled: sound?.enabled,
		minimized: !poppedOut && (minimized || undocked),
		expanded: !minimized && expanded,
		windowed: !minimized && poppedOut,
		logoUrl,
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
