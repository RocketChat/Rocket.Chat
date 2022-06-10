import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useUserSubscription, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../../hooks/useForm';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import NotificationPreferences from './NotificationPreferences';

const NotificationPreferencesWithData = ({ rid }) => {
	const t = useTranslation();

	const subscription = useUserSubscription(rid);

	const customSound = useCustomSound();
	const handleClose = useTabBarClose();
	const saveSettings = useEndpointActionExperimental('POST', 'rooms.saveNotification', t('Room_updated_successfully'));

	const { values, handlers, hasUnsavedChanges, commit } = useForm({
		turnOn: !subscription?.disableNotifications,
		muteGroupMentions: subscription?.muteGroupMentions,
		showCounter: !subscription?.hideUnreadStatus,
		showMentions: !subscription?.hideMentionStatus,
		desktopAlert: (subscription?.desktopPrefOrigin === 'subscription' && subscription.desktopNotifications) || 'default',
		desktopSound: subscription?.audioNotificationValue || 'default',
		mobileAlert: (subscription?.mobilePrefOrigin === 'subscription' && subscription.mobilePushNotifications) || 'default',
		emailAlert: (subscription?.emailPrefOrigin === 'subscription' && subscription.emailNotifications) || 'default',
	});

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
		sound: [['none None', t('None')], ['default', t('Default')], ...customSoundAsset],
	};

	const handlePlaySound = () => customSound.play(values.desktopSound);

	const handleSaveButton = useMutableCallback(() => {
		const notifications = {};

		notifications.disableNotifications = values.turnOn ? '0' : '1';
		notifications.muteGroupMentions = values.muteGroupMentions ? '1' : '0';
		notifications.hideUnreadStatus = values.showCounter ? '0' : '1';
		notifications.hideMentionStatus = values.showMentions ? '0' : '1';
		notifications.desktopNotifications = values.desktopAlert;
		notifications.audioNotificationValue = values.desktopSound;
		notifications.mobilePushNotifications = values.mobileAlert;
		notifications.emailNotifications = values.emailAlert;

		saveSettings({
			roomId: rid,
			notifications,
		});

		commit();
	});

	return (
		<NotificationPreferences
			handleClose={handleClose}
			formValues={values}
			formHandlers={handlers}
			formHasUnsavedChanges={hasUnsavedChanges}
			handlePlaySound={handlePlaySound}
			handleOptions={handleOptions}
			handleSaveButton={handleSaveButton}
		/>
	);
};

export default memo(NotificationPreferencesWithData);
