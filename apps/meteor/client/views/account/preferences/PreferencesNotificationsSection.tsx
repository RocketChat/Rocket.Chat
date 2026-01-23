import type { INotificationDesktop } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Button, Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select, ToggleSwitch } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference, useUser } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../../../hooks/notification/useNotification';

const notificationOptionsLabelMap = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailNotificationOptionsLabelMap = {
	mentions: 'Email_Notification_Mode_All',
	nothing: 'Email_Notification_Mode_Disabled',
};

const PreferencesNotificationsSection = () => {
	const { t, i18n } = useTranslation();
	const user = useUser();

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
	const showMobileRinging = useSetting('VideoConf_Mobile_Ringing');
	const notify = useNotification();

	const userEmailNotificationMode = useUserPreference('emailNotificationMode') as keyof typeof emailNotificationOptionsLabelMap;

	useEffect(() => setNotificationsPermission(window.Notification && Notification.permission), []);

	const onSendNotification = useCallback(() => {
		notify({
			payload: {
				sender: { _id: 'rocket.cat', username: 'rocket.cat' },
				rid: 'GENERAL',
			} as INotificationDesktop['payload'],
			title: t('Desktop_Notification_Test'),
			text: t('This_is_a_desktop_notification'),
		});
	}, [notify, t]);

	const onAskNotificationPermission = useCallback(() => {
		window.Notification && Notification.requestPermission().then((val) => setNotificationsPermission(val));
	}, []);

	const notificationOptions = useMemo(
		() => Object.entries(notificationOptionsLabelMap).map(([key, val]) => i18n.exists(val) && [key, t(val)]),
		[i18n, t],
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
		const options = Object.entries(emailNotificationOptionsLabelMap).map(
			([key, val]) => i18n.exists(val) && [key, t(val)],
		) as SelectOption[];
		options.unshift(['default', `${t('Default')} (${t(emailNotificationOptionsLabelMap[userEmailNotificationMode] as TranslationKey)})`]);
		return options;
	}, [i18n, t, userEmailNotificationMode]);

	const { control } = useFormContext();

	const notificationRequireId = useId();
	const desktopNotificationsId = useId();
	const pushNotificationsId = useId();
	const emailNotificationModeId = useId();
	const receiveLoginDetectionEmailId = useId();
	const notifyCalendarEventsId = useId();
	const enableMobileRingingId = useId();
	const desktopNotificationsLabelId = useId();
	const desktopNotificationVoiceCallsId = useId();

	const showCalendarPreference = user?.settings?.calendar?.outlook?.Enabled;

	return (
		<AccordionItem title={t('Notifications')}>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' id={desktopNotificationsLabelId}>
						{t('Desktop_Notifications')}
					</FieldLabel>
					<FieldRow>
						{notificationsPermission === 'denied' && t('Desktop_Notifications_Disabled')}
						{notificationsPermission === 'granted' && (
							<Button primary onClick={onSendNotification} aria-labelledby={desktopNotificationsLabelId}>
								{t('Test_Desktop_Notifications')}
							</Button>
						)}
						{notificationsPermission !== 'denied' && notificationsPermission !== 'granted' && (
							<Button primary onClick={onAskNotificationPermission} aria-labelledby={desktopNotificationsLabelId}>
								{t('Enable_Desktop_Notifications')}
							</Button>
						)}
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={notificationRequireId}>{t('Notification_RequireInteraction')}</FieldLabel>
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
					</FieldRow>
					<FieldHint id={`${notificationRequireId}-hint`}>{t('Only_works_with_chrome_version_greater_50')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel is='span' id={desktopNotificationsId}>
						{t('Notification_Desktop_Default_For')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='desktopNotifications'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select aria-labelledby={desktopNotificationsId} value={value} onChange={onChange} options={desktopNotificationOptions} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={desktopNotificationVoiceCallsId}>{t('Notification_Desktop_show_voice_calls')}</FieldLabel>
						<Controller
							name='desktopNotificationVoiceCalls'
							control={control}
							render={({ field: { ref, value, onChange } }) => (
								<ToggleSwitch id={desktopNotificationVoiceCallsId} ref={ref} checked={value} onChange={onChange} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel is='span' id={pushNotificationsId}>
						{t('Notification_Push_Default_For')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='pushNotifications'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select aria-labelledby={pushNotificationsId} value={value} onChange={onChange} options={mobileNotificationOptions} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel is='span' id={emailNotificationModeId}>
						{t('Email_Notification_Mode')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='emailNotificationMode'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									aria-describedby={`${emailNotificationModeId}-hint`}
									aria-labelledby={emailNotificationModeId}
									disabled={!canChangeEmailNotification}
									value={value}
									onChange={onChange}
									options={emailNotificationOptions}
								/>
							)}
						/>
					</FieldRow>
					<FieldHint id={`${emailNotificationModeId}-hint`}>
						{canChangeEmailNotification && t('You_need_to_verifiy_your_email_address_to_get_notications')}
						{!canChangeEmailNotification && t('Email_Notifications_Change_Disabled')}
					</FieldHint>
				</Field>
				{showNewLoginEmailPreference && (
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={receiveLoginDetectionEmailId}>{t('Receive_Login_Detection_Emails')}</FieldLabel>
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
						</FieldRow>
						<FieldHint id={`${receiveLoginDetectionEmailId}-hint`}>{t('Receive_Login_Detection_Emails_Description')}</FieldHint>
					</Field>
				)}
				{showCalendarPreference && (
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={notifyCalendarEventsId}>{t('Notify_Calendar_Events')}</FieldLabel>
							<Controller
								name='notifyCalendarEvents'
								control={control}
								render={({ field: { ref, value, onChange } }) => (
									<ToggleSwitch id={notifyCalendarEventsId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
					</Field>
				)}
				{showMobileRinging && (
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={enableMobileRingingId}>{t('VideoConf_Mobile_Ringing')}</FieldLabel>
							<Controller
								name='enableMobileRinging'
								control={control}
								render={({ field: { ref, value, onChange } }) => (
									<ToggleSwitch id={enableMobileRingingId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
					</Field>
				)}
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesNotificationsSection;
