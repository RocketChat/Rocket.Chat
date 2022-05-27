import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Button, Box } from '@rocket.chat/fuselage';
import { useUserPreference, useSetting, useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC, useCallback, useEffect, useState, useMemo } from 'react';

import { KonchatNotification } from '../../../../app/ui';
import { useForm } from '../../../hooks/useForm';
import { useAccountPreferencesForm } from '../contexts/AccountPreferencesFormContext';

type PreferencesNotificationsFormValues = {
	desktopNotificationRequireInteraction: boolean;
	desktopNotifications: string;
	pushNotifications: string;
	emailNotificationMode: string;
};

type PreferencesNotificationsSectionProps = Partial<ComponentProps<typeof Accordion.Item>>;

type options = [string, string][];

const notificationOptionsLabelMap = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailNotificationOptionsLabelMap = {
	mentions: 'Email_Notification_Mode_All',
	nothing: 'Email_Notification_Mode_Disabled',
};

const PreferencesNotificationsSection: FC<PreferencesNotificationsSectionProps> = ({ ...props }) => {
	const t = useTranslation();
	const { commitRef, onChange } = useAccountPreferencesForm();

	const [notificationsPermission, setNotificationsPermission] = useState('');

	const userDesktopNotificationRequireInteraction = useUserPreference('desktopNotificationRequireInteraction');
	const userDesktopNotifications = useUserPreference('desktopNotifications');
	const userMobileNotifications = useUserPreference('pushNotifications');
	const userEmailNotificationMode = useUserPreference('emailNotificationMode') as keyof typeof emailNotificationOptionsLabelMap;

	const defaultDesktopNotifications = useSetting(
		'Accounts_Default_User_Preferences_desktopNotifications',
	) as keyof typeof notificationOptionsLabelMap;
	const defaultMobileNotifications = useSetting(
		'Accounts_Default_User_Preferences_pushNotifications',
	) as keyof typeof notificationOptionsLabelMap;
	const canChangeEmailNotification = useSetting('Accounts_AllowEmailNotifications');

	const { values, handlers, commit } = useForm(
		{
			desktopNotificationRequireInteraction: userDesktopNotificationRequireInteraction,
			desktopNotifications: userDesktopNotifications,
			pushNotifications: userMobileNotifications,
			emailNotificationMode: userEmailNotificationMode,
		},
		onChange,
	);

	const { desktopNotificationRequireInteraction, desktopNotifications, pushNotifications, emailNotificationMode } =
		values as PreferencesNotificationsFormValues;

	const { handleDesktopNotificationRequireInteraction, handleDesktopNotifications, handlePushNotifications, handleEmailNotificationMode } =
		handlers;

	useEffect(() => setNotificationsPermission(window.Notification && Notification.permission), []);

	commitRef.current.notifications = commit;

	const onSendNotification = useCallback(() => {
		KonchatNotification.notify({
			payload: { sender: { username: 'rocket.cat' } },
			title: t('Desktop_Notification_Test'),
			text: t('This_is_a_desktop_notification'),
		});
	}, [t]);

	const onAskNotificationPermission = useCallback(() => {
		window.Notification && Notification.requestPermission().then((val) => setNotificationsPermission(val));
	}, []);

	const notificationOptions = useMemo<options>(
		() => Object.entries(notificationOptionsLabelMap).map(([key, val]) => [key, t(val as TranslationKey)]),
		[t],
	);

	const emailNotificationOptionsMap = useMemo<options>(
		() => Object.entries(emailNotificationOptionsLabelMap).map(([key, val]) => [key, t(val as TranslationKey)]),
		[t],
	);

	const desktopNotificationOptions = useMemo<options>(() => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultDesktopNotifications] as TranslationKey)})`]);
		return optionsCp;
	}, [defaultDesktopNotifications, notificationOptions, t]);

	const mobileNotificationOptions = useMemo<options>(() => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultMobileNotifications] as TranslationKey)})`]);
		return optionsCp;
	}, [defaultMobileNotifications, notificationOptions, t]);

	const emailNotificationOptions = useMemo<options>(() => {
		const options = emailNotificationOptionsMap.slice();
		options.unshift(['default', `${t('Default')} (${t(emailNotificationOptionsLabelMap[userEmailNotificationMode] as TranslationKey)})`]);
		return options;
	}, [t, userEmailNotificationMode, emailNotificationOptionsMap]);

	return (
		<Accordion.Item title={t('Notifications')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Desktop_Notifications')}</Field.Label>
					<Field.Row>
						{notificationsPermission === 'denied' && t('Desktop_Notifications_Disabled')}
						{notificationsPermission === 'granted' && (
							<>
								<Button primary onClick={onSendNotification}>
									{t('Test_Desktop_Notifications')}
								</Button>
							</>
						)}
						{notificationsPermission !== 'denied' && notificationsPermission !== 'granted' && (
							<>
								<Button primary onClick={onAskNotificationPermission}>
									{t('Enable_Desktop_Notifications')}
								</Button>
							</>
						)}
					</Field.Row>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Notification_RequireInteraction')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={desktopNotificationRequireInteraction} onChange={handleDesktopNotificationRequireInteraction} />
						</Field.Row>
					</Box>
					<Field.Hint>{t('Only_works_with_chrome_version_greater_50')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Notification_Desktop_Default_For')}</Field.Label>
					<Field.Row>
						<Select value={desktopNotifications} onChange={handleDesktopNotifications} options={desktopNotificationOptions} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Notification_Push_Default_For')}</Field.Label>
					<Field.Row>
						<Select value={pushNotifications} onChange={handlePushNotifications} options={mobileNotificationOptions} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email_Notification_Mode')}</Field.Label>
					<Field.Row>
						<Select
							disabled={!canChangeEmailNotification}
							value={emailNotificationMode}
							onChange={handleEmailNotificationMode}
							options={emailNotificationOptions}
						/>
					</Field.Row>
					<Field.Hint>
						{canChangeEmailNotification && t('You_need_to_verifiy_your_email_address_to_get_notications')}
						{!canChangeEmailNotification && t('Email_Notifications_Change_Disabled')}
					</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesNotificationsSection;
