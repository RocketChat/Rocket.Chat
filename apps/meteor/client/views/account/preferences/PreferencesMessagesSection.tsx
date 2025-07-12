import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldHint, FieldLabel, FieldLink, FieldRow, Select, ToggleSwitch, FieldDescription } from '@rocket.chat/fuselage-forms';
import { AccordionItem } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesMessagesSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

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
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Unread_Tray_Icon_Alert')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='unreadAlert'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Always_show_thread_replies_in_main_channel')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='showThreadsInMainChannel'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
				<FieldHint>{t('Accounts_Default_User_Preferences_showThreadsInMainChannel_Description')}</FieldHint>
			</Field>
			<Field>
				<FieldLabel required>{t('Also_send_thread_message_to_channel_behavior')}</FieldLabel>
				<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
				<FieldRow>
					<Controller
						name='alsoSendThreadToChannel'
						control={control}
						render={({ field: { value, onChange } }) => (
							<Select value={value} onChange={onChange} options={alsoSendThreadMessageToChannelOptions} />
						)}
					/>
				</FieldRow>
				<FieldHint>{t('Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description')}</FieldHint>
			</Field>
			<Field>
				<FieldLabel required>{t('Message_TimeFormat')}</FieldLabel>
				<FieldLink href='/account/accessibility-and-appearance'>{t('Go_to_accessibility_and_appearance')}</FieldLink>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Use_Emojis')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='useEmojis'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Convert_Ascii_Emojis')}</FieldLabel>
					<Controller
						name='convertAsciiEmoji'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Auto_Load_Images')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='autoImageLoad'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Save_Mobile_Bandwidth')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='saveMobileBandwidth'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Collapse_Embedded_Media_By_Default')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='collapseMediaByDefault'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel required>{t('Hide_usernames')}</FieldLabel>
				<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
				<FieldLink href='/account/accessibility-and-appearance'>{t('Go_to_accessibility_and_appearance')}</FieldLink>
			</Field>
			<Field>
				<FieldLabel required>{t('Hide_roles')}</FieldLabel>
				<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
				<FieldLink href='/account/accessibility-and-appearance'>{t('Go_to_accessibility_and_appearance')}</FieldLink>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Hide_flextab')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='hideFlexTab'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Display_avatars')}</FieldLabel>
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<Controller
						name='displayAvatars'
						control={control}
						render={({ field: { value, onChange, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel required>{t('Enter_Behaviour')}</FieldLabel>
				<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
				<FieldRow>
					<Controller
						name='sendOnEnter'
						control={control}
						render={({ field: { value, onChange } }) => <Select value={value} onChange={onChange} options={sendOnEnterOptions} />}
					/>
				</FieldRow>
				<FieldHint>{t('Enter_Behaviour_Description')}</FieldHint>
			</Field>
		</AccordionItem>
	);
};

export default PreferencesMessagesSection;
