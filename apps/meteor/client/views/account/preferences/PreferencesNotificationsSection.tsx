import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { KonchatNotification } from '../../../../app/ui/client/lib/KonchatNotification';

const notificationOptionsLabelMap = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailNotificationOptionsLabelMap = {
	mentions: 'Email_Notification_Mode_All',
	nothing: 'Email_Notification_Mode_Disabled',
};

// TODO: Test Notification Button not working
const PreferencesNotificationsSection = () => {
	const t = useTranslation();

	const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission>();

	const defaultDesktopNotifications = useSetting(
		'Accounts_Default_User_Preferences_desktopNotifications',
	) as keyof typeof notificationOptionsLabelMap;
	const defaultMobileNotifications = useSetting(
		'Accounts_Default_User_Preferences_pushNotifications',
	) as keyof typeof notificationOptionsLabelMap;
	const canChangeEmailNotification = useSetting('Accounts_AllowEmailNotifications');

	const loginEmailEnabled = useSetting('Device_Management_Enable_Login_Emails');
	const allowLoginEmailPreference = useSetting('Device_Management_Allow_Login_Email_preference');
	const showNewLoginEmailPreference = loginEmailEnabled && allowLoginEmailPreference;
	const showCalendarPreference = useSetting('Outlook_Calendar_Enabled');
	const showMobileRinging = useSetting('VideoConf_Mobile_Ringing');

	const userEmailNotificationMode = useUserPreference('emailNotificationMode') as keyof typeof emailNotificationOptionsLabelMap;

	useEffect(() => setNotificationsPermission(window.Notification && Notification.permission), []);

	const onSendNotification = useCallback(() => {
		KonchatNotification.notify({
			payload: { sender: { _id: 'rocket.cat', username: 'rocket.cat' } },
			title: t('Desktop_Notification_Test'),
			text: t('This_is_a_desktop_notification'),
		});
	}, [t]);

	const onAskNotificationPermission = useCallback(() => {
		window.Notification && Notification.requestPermission().then((val) => setNotificationsPermission(val));
	}, []);

	const notificationOptions = useMemo(
		() => Object.entries(notificationOptionsLabelMap).map(([key, val]) => t.has(val) && [key, t(val)]),
		[t],
	) as SelectOption[];

	const desktopNotificationOptions = useMemo<SelectOption[]>((): SelectOption[] => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultDesktopNotifications] as TranslationKey)})`]);
		return optionsCp;
	}, [defaultDesktopNotifications, notificationOptions, t]);

	const mobileNotificationOptions = useMemo(() => {
		const optionsCp = notificationOptions.slice();
		optionsCp.unshift(['default', `${t('Default')} (${t(notificationOptionsLabelMap[defaultMobileNotifications] as TranslationKey)})`]);
		return optionsCp;
	}, [defaultMobileNotifications, notificationOptions, t]);

	const emailNotificationOptions = useMemo(() => {
		const options = Object.entries(emailNotificationOptionsLabelMap).map(([key, val]) => t.has(val) && [key, t(val)]) as SelectOption[];
		options.unshift(['default', `${t('Default')} (${t(emailNotificationOptionsLabelMap[userEmailNotificationMode] as TranslationKey)})`]);
		return options;
	}, [t, userEmailNotificationMode]);

	const { control } = useFormContext();

	const notificationRequireId = useUniqueId();
	const desktopNotificationsId = useUniqueId();
	const pushNotificationsId = useUniqueId();
	const emailNotificationModeId = useUniqueId();
	const receiveLoginDetectionEmailId = useUniqueId();
	const notifyCalendarEventsId = useUniqueId();
	const enableMobileRingingId = useUniqueId();

	return (
		<Accordion.Item title={t('Notifications')}>
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
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label htmlFor={notificationRequireId}>{t('Notification_RequireInteraction')}</Field.Label>
						<Field.Row>
							<Controller
								name='desktopNotificationRequireInteraction'
								control={control}
								render={({ field: { ref, value, onChange } }) => (
									<ToggleSwitch
										aria-describedby={`${notificationRequireId}-hint`}
										id={notificationRequireId}
										ref={ref}
										checked={value}
										onChange={onChange}
									/>
								)}
							/>
						</Field.Row>
					</Box>
					<Field.Hint id={`${notificationRequireId}-hint`}>{t('Only_works_with_chrome_version_greater_50')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label htmlFor={desktopNotificationsId}>{t('Notification_Desktop_Default_For')}</Field.Label>
					<Field.Row>
						<Controller
							name='desktopNotifications'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select id={desktopNotificationsId} value={value} onChange={onChange} options={desktopNotificationOptions} />
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label htmlFor={pushNotificationsId}>{t('Notification_Push_Default_For')}</Field.Label>
					<Field.Row>
						<Controller
							name='pushNotifications'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select id={pushNotificationsId} value={value} onChange={onChange} options={mobileNotificationOptions} />
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label htmlFor={emailNotificationModeId}>{t('Email_Notification_Mode')}</Field.Label>
					<Field.Row>
						<Controller
							name='emailNotificationMode'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									aria-describedby={`${emailNotificationModeId}-hint`}
									id={emailNotificationModeId}
									disabled={!canChangeEmailNotification}
									value={value}
									onChange={onChange}
									options={emailNotificationOptions}
								/>
							)}
						/>
					</Field.Row>
					<Field.Hint id={`${emailNotificationModeId}-hint`}>
						{canChangeEmailNotification && t('You_need_to_verifiy_your_email_address_to_get_notications')}
						{!canChangeEmailNotification && t('Email_Notifications_Change_Disabled')}
					</Field.Hint>
				</Field>
				{showNewLoginEmailPreference && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={receiveLoginDetectionEmailId}>{t('Receive_Login_Detection_Emails')}</Field.Label>
							<Field.Row>
								<Controller
									name='receiveLoginDetectionEmail'
									control={control}
									render={({ field: { ref, value, onChange } }) => (
										<ToggleSwitch
											aria-describedby={`${receiveLoginDetectionEmailId}-hint`}
											id={receiveLoginDetectionEmailId}
											ref={ref}
											checked={value}
											onChange={onChange}
										/>
									)}
								/>
							</Field.Row>
						</Box>
						<Field.Hint id={`${receiveLoginDetectionEmailId}-hint`}>{t('Receive_Login_Detection_Emails_Description')}</Field.Hint>
					</Field>
				)}
				{showCalendarPreference && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={notifyCalendarEventsId}>{t('Notify_Calendar_Events')}</Field.Label>
							<Field.Row>
								<Controller
									name='notifyCalendarEvents'
									control={control}
									render={({ field: { ref, value, onChange } }) => (
										<ToggleSwitch id={notifyCalendarEventsId} ref={ref} checked={value} onChange={onChange} />
									)}
								/>
							</Field.Row>
						</Box>
					</Field>
				)}
				{showMobileRinging && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={enableMobileRingingId}>{t('VideoConf_Mobile_Ringing')}</Field.Label>
							<Field.Row>
								<Controller
									name='enableMobileRinging'
									control={control}
									render={({ field: { ref, value, onChange } }) => (
										<ToggleSwitch id={enableMobileRingingId} ref={ref} checked={value} onChange={onChange} />
									)}
								/>
							</Field.Row>
						</Box>
					</Field>
				)}
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesNotificationsSection;
