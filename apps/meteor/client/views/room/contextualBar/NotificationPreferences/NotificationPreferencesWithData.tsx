import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useUserSubscription, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../../hooks/useForm';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import NotificationPreferences from './NotificationPreferences';

export type NotificationFormValues = {
	turnOn: boolean;
	muteGroupMentions: boolean;
	showCounter: boolean;
	showMentions: boolean;
	desktopAlert: string;
	desktopSound: string;
	mobileAlert: string;
	emailAlert: string;
};

const NotificationPreferencesWithData = ({ rid }: { rid: string }): ReactElement => {
	const t = useTranslation();

	const subscription = useUserSubscription(rid);

	const customSound = useCustomSound();
	const handleClose = useTabBarClose();
	const saveSettings = useEndpointActionExperimental('POST', '/v1/rooms.saveNotification', t('Room_updated_successfully'));

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

	const { turnOn, muteGroupMentions, showCounter, showMentions, desktopAlert, desktopSound, mobileAlert, emailAlert } =
		values as NotificationFormValues;

	const defaultOption: [string, string][] = [
		['default', t('Default')],
		['all', t('All_messages')],
		['mentions', t('Mentions')],
		['nothing', t('Nothing')],
	];

	const customSoundAsset = customSound?.getList()?.map((value) => [value._id, value.name]) || [];

	const handleOptions = {
		alerts: defaultOption,
		audio: defaultOption,
		sound: [['none None', t('None')], ['default', t('Default')], ...customSoundAsset] as [string, string][],
	};

	const handlePlaySound = (): void => customSound.play(desktopSound);

	const handleSaveButton = useMutableCallback(() => {
		const notifications = {
			disableNotifications: turnOn ? '0' : '1',
			muteGroupMentions: muteGroupMentions ? '1' : '0',
			hideUnreadStatus: showCounter ? '0' : '1',
			hideMentionStatus: showMentions ? '0' : '1',
			desktopNotifications: desktopAlert,
			audioNotificationValue: desktopSound,
			mobilePushNotifications: mobileAlert,
			emailNotifications: emailAlert,
		};

		saveSettings({
			roomId: rid,
			notifications,
		});

		commit();
	});

	return (
		<NotificationPreferences
			handleClose={handleClose}
			formValues={values as NotificationFormValues}
			formHandlers={handlers}
			formHasUnsavedChanges={hasUnsavedChanges}
			handlePlaySound={handlePlaySound}
			handleOptions={handleOptions}
			handleSaveButton={handleSaveButton}
		/>
	);
};

export default memo(NotificationPreferencesWithData);
