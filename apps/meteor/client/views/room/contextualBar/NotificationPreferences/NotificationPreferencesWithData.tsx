import type { SelectOption } from '@rocket.chat/fuselage';
import { useTranslation, useCustomSound } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
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

const NotificationPreferencesWithData = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const { closeTab } = useRoomToolbox();
	const customSound = useCustomSound();

	const saveSettings = useEndpointAction('POST', '/v1/rooms.saveNotification', {
		successMessage: t('Room_updated_successfully'),
	});

	const customSoundAsset: SelectOption[] | undefined = customSound?.getList()?.map((value) => [value._id, value.name]);

	const defaultOption: SelectOption[] = [
		['default', t('Default')],
		['all', t('All_messages')],
		['mentions', t('Mentions')],
		['nothing', t('Nothing')],
	];

	const defaultSoundOption: SelectOption[] = [
		['none', t('None')],
		['default', t('Default')],
	];

	const notificationOptions = {
		alerts: defaultOption,
		sounds: customSoundAsset ? [...defaultSoundOption, ...customSoundAsset] : defaultSoundOption,
	};

	const methods = useForm({
		defaultValues: {
			turnOn: !subscription?.disableNotifications,
			muteGroupMentions: !!subscription?.muteGroupMentions,
			showCounter: !subscription?.hideUnreadStatus,
			showMentions: !subscription?.hideMentionStatus,
			desktopAlert: (subscription?.desktopPrefOrigin === 'subscription' && subscription.desktopNotifications) || 'default',
			desktopSound: subscription?.audioNotificationValue || 'default',
			mobileAlert: (subscription?.mobilePrefOrigin === 'subscription' && subscription.mobilePushNotifications) || 'default',
			emailAlert: (subscription?.emailPrefOrigin === 'subscription' && subscription.emailNotifications) || 'default',
		},
	});

	const { desktopSound } = methods.watch();

	const handlePlaySound = (): void => {
		customSound.play(desktopSound);
	};

	const handleSave = methods.handleSubmit(
		({ turnOn, muteGroupMentions, showCounter, showMentions, desktopAlert, desktopSound, mobileAlert, emailAlert }) => {
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
				roomId: room._id,
				notifications,
			});
		},
	);

	return (
		<FormProvider {...methods}>
			<NotificationPreferences
				handleClose={closeTab}
				handleSave={handleSave}
				handlePlaySound={handlePlaySound}
				notificationOptions={notificationOptions}
			/>
		</FormProvider>
	);
};

export default memo(NotificationPreferencesWithData);
