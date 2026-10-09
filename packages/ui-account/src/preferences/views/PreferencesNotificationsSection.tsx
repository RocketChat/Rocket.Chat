import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Button } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PreferencesViewModel } from '../logic/usePreferences';

export type PreferencesNotificationsSectionProps = {
	notifications: PreferencesViewModel['notifications'];
	onSendTestNotification: () => void;
};

const notificationOptionsLabelMap = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailNotificationOptionsLabelMap = {
	mentions: 'Email_Notification_Mode_All',
	nothing: 'Email_Notification_Mode_Disabled',
};

const PreferencesNotificationsSection = ({
	notifications: {
		defaultDesktop: defaultDesktopNotifications,
		defaultMobile: defaultMobileNotifications,
		userEmailMode: userEmailNotificationMode,
		canChangeEmailNotification,
		showNewLoginEmailPreference,
		showCalendarPreference,
		showMobileRinging,
	},
	onSendTestNotification: onSendNotification,
}: PreferencesNotificationsSectionProps) => {
	const { t, i18n } = useTranslation();

	const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission>();

	useEffect(() => setNotificationsPermission(window.Notification && Notification.permission), []);

	const onAskNotificationPermission = useCallback(() => {
		if (window.Notification) void Notification.requestPermission().then((val) => setNotificationsPermission(val));
	}, []);

	const notificationOptions = useMemo(
		() => Object.entries(notificationOptionsLabelMap).map(([key, val]) => i18n.exists(val) && [key, t(val)]),
		[i18n, t],
	) as SelectOption[];

	const desktopNotificationOptions = useMemo<SelectOption[]>((): SelectOption[] => {
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
		const options = Object.entries(emailNotificationOptionsLabelMap).map(
			([key, val]) => i18n.exists(val) && [key, t(val)],
		) as SelectOption[];
		options.unshift(['default', `${t('Default')} (${t(emailNotificationOptionsLabelMap[userEmailNotificationMode])})`]);
		return options;
	}, [i18n, t, userEmailNotificationMode]);

	const { control } = useFormContext();

	const desktopNotificationsLabelId = useId();

	return (
		<AccordionItem title={t('Notifications')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Desktop_Notifications')}</FieldLabel>
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
						<FieldLabel>{t('Notification_RequireInteraction')}</FieldLabel>
						<Controller
							name='desktopNotificationRequireInteraction'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Only_works_with_chrome_version_greater_50')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel>{t('Notification_Desktop_Default_For')}</FieldLabel>
					<FieldRow>
						<Controller
							name='desktopNotifications'
							control={control}
							render={({ field }) => <Select {...field} options={desktopNotificationOptions} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Notification_Desktop_show_voice_calls')}</FieldLabel>
						<Controller
							name='desktopNotificationVoiceCalls'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Notification_Push_Default_For')}</FieldLabel>
					<FieldRow>
						<Controller
							name='pushNotifications'
							control={control}
							render={({ field }) => <Select {...field} options={mobileNotificationOptions} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Email_Notification_Mode')}</FieldLabel>
					<FieldRow>
						<Controller
							name='emailNotificationMode'
							control={control}
							render={({ field }) => <Select disabled={!canChangeEmailNotification} {...field} options={emailNotificationOptions} />}
						/>
					</FieldRow>
					<FieldHint>
						{canChangeEmailNotification && t('You_need_to_verifiy_your_email_address_to_get_notications')}
						{!canChangeEmailNotification && t('Email_Notifications_Change_Disabled')}
					</FieldHint>
				</Field>
				{showNewLoginEmailPreference && (
					<Field>
						<FieldRow>
							<FieldLabel>{t('Receive_Login_Detection_Emails')}</FieldLabel>
							<Controller
								name='receiveLoginDetectionEmail'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
							/>
						</FieldRow>
						<FieldHint>{t('Receive_Login_Detection_Emails_Description')}</FieldHint>
					</Field>
				)}
				{showCalendarPreference && (
					<Field>
						<FieldRow>
							<FieldLabel>{t('Notify_Calendar_Events')}</FieldLabel>
							<Controller
								name='notifyCalendarEvents'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
				)}
				{showMobileRinging && (
					<Field>
						<FieldRow>
							<FieldLabel>{t('VideoConf_Mobile_Ringing')}</FieldLabel>
							<Controller
								name='enableMobileRinging'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
				)}
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesNotificationsSection;
