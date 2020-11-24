import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useUserSubscription, useUser } from '../../contexts/UserContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useCustomSound } from '../../contexts/CustomSoundContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import NotificationPreferences from '../../components/basic/NotificationsPreferences';

export default React.memo(({ tabBar, rid }) => {
	const subscription = useUserSubscription(rid);
	const t = useTranslation();
	const customSound = useCustomSound();
	const userSettingsPreferences = useUser().settings.preferences;
	const notifications = useRef({});

	const saveSettings = useEndpointActionExperimental('POST', 'rooms.saveNotification');

	const [handleSelect, setHandleSelect] = useState({
		desktop: {
			alert: subscription.desktopNotifications || userSettingsPreferences.desktopNotifications,
			audio: subscription.audioNotifications || userSettingsPreferences.audioNotifications,
			sound: subscription.audioNotificationValue || userSettingsPreferences.newMessageNotification,
		},
		mobile: {
			alert: subscription.mobilePushNotifications || userSettingsPreferences.mobileNotifications,
		},
		email: {
			alert: subscription.emailNotifications || userSettingsPreferences.emailNotificationMode,
		},
	});

	const handleClose = useMutableCallback(() => tabBar && tabBar.close());

	const handleOn = useMemo(() => ({
		turnOn: !subscription.disableNotifications,
		muteGroupMentions: subscription.muteGroupMentions,
		showCounter: !subscription.hideUnreadStatus,
	}), [subscription.disableNotifications, subscription.muteGroupMentions, subscription.hideUnreadStatus]);

	const handleSwitch = {
		turnOn: useMutableCallback((event) => {
			notifications.current.disableNotifications = event.target.checked ? '0' : '1';
		}),
		muteGroupMentions: useMutableCallback((event) => {
			notifications.current.muteGroupMentions = event.target.checked ? '1' : '0';
		}),
		showCounter: useMutableCallback((event) => {
			notifications.current.hideUnreadStatus = event.target.checked ? '0' : '1';
		}),
	};

	const defaultOption = [
		['default', t('Default')],
		['all', t('All_messages')],
		['mentions', t('Mentions')],
		['nothing', t('Nothing')],
	];

	const customSoundAsset = Object.entries(customSound.list.get()).map((value) => [value[0], value[1].name]);

	const handleOptions = {
		alerts: defaultOption,
		audio: defaultOption,
		sound: [
			['none None', t('None')],
			['0 default', t('Default')],
			...customSoundAsset,
		],
	};

	const changeOption = useMutableCallback((device, select, value) => {
		setHandleSelect((prevState) => {
			prevState[device][select] = value;

			return { ...prevState };
		});
	});

	const handleSoundChange = {
		desktopSound: useMutableCallback((value) => {
			customSound.play(value);

			changeOption('desktop', 'sound', value);
			notifications.current.audioNotificationValue = value;
		}),
	};

	const handleChangeOption = {
		desktopAlert: useMutableCallback((value) => {
			changeOption('desktop', 'alert', value);
			notifications.current.desktopNotifications = value;
		}),
		desktopAudio: useMutableCallback((value) => {
			changeOption('desktop', 'audio', value);
			notifications.current.audioNotifications = value;
		}),
		mobileAlert: useMutableCallback((value) => {
			changeOption('mobile', 'alert', value);
			notifications.current.mobilePushNotifications = value;
		}),
		emailAlert: useMutableCallback((value) => {
			changeOption('email', 'alert', value);
			notifications.current.emailNotifications = value;
		}),
	};

	const handleSaveButton = useCallback(() => {
		if (Object.keys(notifications.current).length) {
			saveSettings({
				roomId: rid,
				notifications: notifications.current,
			});
		}

		handleClose();
	}, [rid, saveSettings, handleClose]);


	return (
		<NotificationPreferences
			handleClose={handleClose}
			handleOn={handleOn}
			handleSwitch={handleSwitch}
			handleOptions={handleOptions}
			handleSoundChange={handleSoundChange}
			handleChangeOption={handleChangeOption}
			handleSelect={handleSelect}
			handleSaveButton={handleSaveButton}
		/>
	);
});
