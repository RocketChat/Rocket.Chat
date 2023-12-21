import {
	Field,
	FieldLabel,
	FieldRow,
	TextInput,
	ToggleSwitch,
	Accordion,
	FieldGroup,
	InputBox,
	TextAreaInput,
	NumberInput,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const AppearanceForm = () => {
	const t = useTranslation();

	const { control, watch } = useFormContext();
	const { Livechat_enable_message_character_limit } = watch();

	const livechatTitleField = useUniqueId();
	const livechatTitleColorField = useUniqueId();
	const livechatEnableMessageCharacterLimit = useUniqueId();
	const livechatMessageCharacterLimit = useUniqueId();
	const livechatShowAgentInfo = useUniqueId();
	const livechatShowAgentEmail = useUniqueId();
	const livechatDisplayOfflineForm = useUniqueId();
	const livechatOfflineFormUnavailableField = useUniqueId();
	const livechatOfflineMessageField = useUniqueId();
	const livechatOfflineTitleField = useUniqueId();
	const livechatOfflineTitleColorField = useUniqueId();
	const livechatOfflineEmailField = useUniqueId();
	const livechatOfflineSuccessMessageField = useUniqueId();
	const livechatRegistrationForm = useUniqueId();
	const livechatNameFieldRegistrationForm = useUniqueId();
	const livechatEmailFieldRegistrationForm = useUniqueId();
	const livechatRegistrationFormMessageField = useUniqueId();
	const livechatConversationFinishedMessageField = useUniqueId();
	const livechatConversationFinishedTextField = useUniqueId();

	return (
		<Accordion>
			<Accordion.Item defaultExpanded title={t('Livechat_online')}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={livechatTitleField}>{t('Title')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_title'
								control={control}
								render={({ field }) => <TextInput id={livechatTitleField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatTitleColorField}>{t('Title_bar_color')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_title_color'
								control={control}
								render={({ field }) => <InputBox id={livechatTitleColorField} type='color' {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatEnableMessageCharacterLimit}>{t('Livechat_enable_message_character_limit')}</FieldLabel>
							<Controller
								name='Livechat_enable_message_character_limit'
								control={control}
								render={({ field: { value, ...field } }) => (
									<ToggleSwitch id={livechatEnableMessageCharacterLimit} {...field} checked={value} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatMessageCharacterLimit}>{t('Message_Characther_Limit')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_message_character_limit'
								control={control}
								render={({ field: { value, onChange, ...field } }) => (
									<NumberInput
										{...field}
										id={livechatMessageCharacterLimit}
										disabled={!Livechat_enable_message_character_limit}
										value={value}
										onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.currentTarget.value) < 0 ? 0 : e.currentTarget.value)}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatShowAgentInfo}>{t('Show_agent_info')}</FieldLabel>
							<Controller
								name='Livechat_show_agent_info'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatShowAgentInfo} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatShowAgentEmail}>{t('Show_agent_email')}</FieldLabel>
							<Controller
								name='Livechat_show_agent_email'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatShowAgentEmail} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
			<Accordion.Item title={t('Livechat_offline')}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatDisplayOfflineForm}>{t('Display_offline_form')}</FieldLabel>
							<Controller
								name='Livechat_display_offline_form'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatDisplayOfflineForm} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineFormUnavailableField}>{t('Offline_form_unavailable_message')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_form_unavailable'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineFormUnavailableField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineMessageField}>{t('Offline_message')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_message'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineMessageField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineTitleField}>{t('Title_offline')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_title'
								control={control}
								render={({ field }) => <TextInput id={livechatOfflineTitleField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineTitleColorField}>{t('Title_bar_color_offline')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_title_color'
								control={control}
								render={({ field }) => <InputBox id={livechatOfflineTitleColorField} {...field} type='color' />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineEmailField}>{t('Email_address_to_send_offline_messages')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_email'
								control={control}
								render={({ field }) => <TextInput id={livechatOfflineEmailField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatOfflineSuccessMessageField}>{t('Offline_success_message')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_success_message'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineSuccessMessageField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
			<Accordion.Item title={t('Livechat_registration_form')}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatRegistrationForm}>{t('Enabled')}</FieldLabel>
							<Controller
								name='Livechat_registration_form'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatRegistrationForm} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatNameFieldRegistrationForm}>{t('Show_name_field')}</FieldLabel>
							<Controller
								name='Livechat_name_field_registration_form'
								control={control}
								render={({ field: { value, ...field } }) => (
									<ToggleSwitch id={livechatNameFieldRegistrationForm} {...field} checked={value} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={livechatEmailFieldRegistrationForm}>{t('Show_email_field')}</FieldLabel>
							<Controller
								name='Livechat_email_field_registration_form'
								control={control}
								render={({ field: { value, ...field } }) => (
									<ToggleSwitch id={livechatEmailFieldRegistrationForm} {...field} checked={value} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatRegistrationFormMessageField}>{t('Livechat_registration_form_message')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_registration_form_message'
								control={control}
								render={({ field }) => (
									<TextAreaInput id={livechatRegistrationFormMessageField} {...field} rows={3} placeholder={t('Offline_message')} />
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
			<Accordion.Item title={t('Conversation_finished')}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={livechatConversationFinishedMessageField}>{t('Conversation_finished_message')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_conversation_finished_message'
								control={control}
								render={({ field }) => (
									<TextAreaInput id={livechatConversationFinishedMessageField} {...field} rows={3} placeholder={t('Offline_message')} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={livechatConversationFinishedTextField}>{t('Conversation_finished_text')}</FieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_conversation_finished_text'
								control={control}
								render={({ field }) => (
									<TextAreaInput id={livechatConversationFinishedTextField} {...field} rows={3} placeholder={t('Offline_message')} />
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
		</Accordion>
	);
};

export default AppearanceForm;
