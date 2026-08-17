import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldLink, FieldRow, Select, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { useId, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesMessagesSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	const messageTimeFormatLabelId = useId();
	const hideUsernamesLabelId = useId();
	const hideRolesLabelId = useId();

	const alsoSendThreadMessageToChannelOptions = useMemo(
		(): SelectOption[] => [
			['default', t('Selected_first_reply_unselected_following_replies')],
			['always', t('Selected_by_default')],
			['never', t('Unselected_by_default')],
		],
		[t],
	);

	const sendOnEnterOptions = useMemo(
		(): SelectOption[] => [
			['normal', t('Enter_Normal')],
			['alternative', t('Enter_Alternative')],
			['desktop', t('Only_On_Desktop')],
		],
		[t],
	);

	return (
		<AccordionItem title={t('Messages')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Unread_Tray_Icon_Alert')}</FieldLabel>
						<Controller
							name='unreadAlert'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Always_show_thread_replies_in_main_channel')}</FieldLabel>
						<Controller
							name='showThreadsInMainChannel'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_showThreadsInMainChannel_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel>{t('Also_send_thread_message_to_channel_behavior')}</FieldLabel>
					<FieldRow>
						<Controller
							name='alsoSendThreadToChannel'
							control={control}
							render={({ field }) => <Select {...field} options={alsoSendThreadMessageToChannelOptions} />}
						/>
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel id={messageTimeFormatLabelId}>{t('Message_TimeFormat')}</FieldLabel>
					<FieldLink aria-describedby={messageTimeFormatLabelId} href='/account/accessibility-and-appearance#clockMode'>
						{t('Go_to_accessibility_and_appearance')}
					</FieldLink>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Use_Emojis')}</FieldLabel>
						<Controller
							name='useEmojis'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Convert_Ascii_Emojis')}</FieldLabel>
						<Controller
							name='convertAsciiEmoji'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Auto_Load_Images')}</FieldLabel>
						<Controller
							name='autoImageLoad'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Save_Mobile_Bandwidth')}</FieldLabel>
						<Controller
							name='saveMobileBandwidth'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Collapse_Embedded_Media_By_Default')}</FieldLabel>
						<Controller
							name='collapseMediaByDefault'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel id={hideUsernamesLabelId}>{t('Hide_usernames')}</FieldLabel>
					<FieldLink aria-describedby={hideUsernamesLabelId} href='/account/accessibility-and-appearance#hideUsernames'>
						{t('Go_to_accessibility_and_appearance')}
					</FieldLink>
				</Field>
				<Field>
					<FieldLabel id={hideRolesLabelId}>{t('Hide_roles')}</FieldLabel>
					<FieldLink aria-describedby={hideRolesLabelId} href='/account/accessibility-and-appearance#hideRoles'>
						{t('Go_to_accessibility_and_appearance')}
					</FieldLink>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Hide_flextab')}</FieldLabel>
						<Controller
							name='hideFlexTab'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Display_avatars')}</FieldLabel>
						<Controller
							name='displayAvatars'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Enter_Behaviour')}</FieldLabel>
					<FieldRow>
						<Controller name='sendOnEnter' control={control} render={({ field }) => <Select {...field} options={sendOnEnterOptions} />} />
					</FieldRow>
					<FieldHint>{t('Enter_Behaviour_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesMessagesSection;
