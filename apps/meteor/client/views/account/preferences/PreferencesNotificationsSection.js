import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Button, Box } from '@rocket.chat/fuselage';
import { useUserPreference, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { KonchatNotification } from '../../../../app/ui';
import { useForm } from '../../../hooks/useForm';

const notificationOptionsLabelMap = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailNotificationOptionsLabelMap = {
	mentions: 'Email_Notification_Mode_All',
	nothing: 'Email_Notification_Mode_Disabled',
};

const PreferencesNotificationsSection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();

	const [notificationsPermission, setNotificationsPermission] = useState();

	const userDesktopNotificationRequireInteraction = useUserPreference('desktopNotificationRequireInteraction');
	const userDesktopNotifications = useUserPreference('desktopNotifications');
	const userMobileNotifications = useUserPreference('pushNotifications');
	const userEmailNotificationMode = useUserPreference('emailNotificationMode');

	const defaultDesktopNotifications = useSetting('Accounts_Default_User_Preferences_desktopNotifications');
	const defaultMobileNotifications = useSetting('Accounts_Default_User_Preferences_pushNotifications');
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

	const { desktopNotificationRequireInteraction, desktopNotifications, pushNotifications, emailNotificationMode } = values;

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

	const notificationOptions = useMemo(() => Object.entries(notificationOptionsLabelMap).map(([key, val]) => [key, t(val)]), [t]);

	const desktopNotificationOptions = useMemo(() => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultDesktopNotifications])})`]);
		return optionsCp;
	}, [defaultDesktopNotifications, notificationOptions, t]);

	const mobileNotificationOptions = useMemo(() => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultMobileNotifications])})`]);
		return optionsCp;
	}, [defaultMobileNotifications, notificationOptions, t]);

	const emailNotificationOptions = useMemo(() => {
		const options = Object.entries(emailNotificationOptionsLabelMap).map(([key, val]) => [key, t(val)]);
		options.unshift(['default', `${t('Default')} (${t(emailNotificationOptionsLabelMap[userEmailNotificationMode])})`]);
		return options;
	}, [t, userEmailNotificationMode]);

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
