import {
	Field,
	FieldRow,
	TextInput,
	ToggleSwitch,
	Accordion,
	AccordionItem,
	FieldGroup,
	InputBox,
	TextAreaInput,
	NumberInput,
	Select,
	MultiSelect,
	FieldHint,
} from '@rocket.chat/fuselage';
import { useId, type ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AppearanceFieldLabel from './AppearanceFieldLabel';
import MarkdownText from '../../../components/MarkdownText';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const AppearanceForm = () => {
	const { t } = useTranslation();
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	const { control, watch } = useFormContext();
	const { Livechat_enable_message_character_limit } = watch();

	const livechatTitleField = useId();
	const livechatTitleColorField = useId();
	const livechatEnableMessageCharacterLimit = useId();
	const livechatMessageCharacterLimit = useId();
	const livechatShowAgentInfo = useId();
	const livechatShowAgentEmail = useId();
	const livechatDisplayOfflineForm = useId();
	const livechatOfflineFormUnavailableField = useId();
	const livechatOfflineMessageField = useId();
	const livechatOfflineTitleField = useId();
	const livechatOfflineTitleColorField = useId();
	const livechatOfflineEmailField = useId();
	const livechatOfflineSuccessMessageField = useId();
	const livechatRegistrationForm = useId();
	const livechatNameFieldRegistrationForm = useId();
	const livechatEmailFieldRegistrationForm = useId();
	const livechatRegistrationFormMessageField = useId();
	const livechatConversationFinishedMessageField = useId();
	const livechatConversationFinishedTextField = useId();
	const livechatHideWatermarkField = useId();
	const livechatWidgetPositionField = useId();
	const livechatBackgroundField = useId();
	const livechatHideSystemMessagesField = useId();
	const omnichannelVisitorsCanCloseConversationField = useId();

	return (
		<Accordion>
			<AccordionItem defaultExpanded title={t('General')}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel premium htmlFor={livechatHideWatermarkField}>
								{t('Livechat_hide_watermark')}
							</AppearanceFieldLabel>
							<Controller
								name='Livechat_hide_watermark'
								control={control}
								render={({ field: { value, ...field } }) => (
									<ToggleSwitch id={livechatHideWatermarkField} {...field} checked={value} disabled={!isEnterprise} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel premium htmlFor={livechatBackgroundField}>
							{t('Livechat_background')}
						</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_background'
								control={control}
								render={({ field: { value, ...field } }) => (
									<TextInput {...field} id={livechatBackgroundField} value={value} disabled={!isEnterprise} />
								)}
							/>
						</FieldRow>
						<FieldHint>
							<MarkdownText variant='inline' preserveHtml content={t('Livechat_background_description')} />
						</FieldHint>
					</Field>

					<Field>
						<AppearanceFieldLabel premium htmlFor={livechatWidgetPositionField}>
							{t('Livechat_widget_position_on_the_screen')}
						</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_widget_position'
								control={control}
								render={({ field: { value, ...field } }) => (
									<Select
										{...field}
										id={livechatWidgetPositionField}
										value={value}
										disabled={!isEnterprise}
										options={[
											['left', t('Left')],
											['right', t('Right')],
										]}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					<Field>
						<AppearanceFieldLabel premium htmlFor={livechatHideSystemMessagesField}>
							{t('Livechat_hide_system_messages')}
						</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_hide_system_messages'
								control={control}
								render={({ field: { value, ...field } }) => (
									<MultiSelect
										{...field}
										id={livechatHideSystemMessagesField}
										value={value}
										disabled={!isEnterprise}
										options={[
											['uj', t('Message_HideType_uj')],
											['ul', t('Message_HideType_ul')],
											['livechat-close', t('Message_HideType_livechat_closed')],
											['livechat-started', t('Message_HideType_livechat_started')],
											['livechat_transfer_history', t('Message_HideType_livechat_transfer_history')],
										]}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel htmlFor={omnichannelVisitorsCanCloseConversationField}>
								{t('Omnichannel_allow_visitors_to_close_conversation')}
							</AppearanceFieldLabel>
							<Controller
								name='Omnichannel_allow_visitors_to_close_conversation'
								control={control}
								render={({ field: { value, ...field } }) => (
									<ToggleSwitch id={omnichannelVisitorsCanCloseConversationField} {...field} checked={value} />
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</AccordionItem>

			<AccordionItem defaultExpanded title={t('Livechat_online')}>
				<FieldGroup>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatTitleField}>{t('Title')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_title'
								control={control}
								render={({ field }) => <TextInput id={livechatTitleField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatTitleColorField}>{t('Title_bar_color')}</AppearanceFieldLabel>
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
							<AppearanceFieldLabel htmlFor={livechatEnableMessageCharacterLimit}>
								{t('Livechat_enable_message_character_limit')}
							</AppearanceFieldLabel>
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
						<AppearanceFieldLabel htmlFor={livechatMessageCharacterLimit}>{t('Message_Characther_Limit')}</AppearanceFieldLabel>
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
							<AppearanceFieldLabel htmlFor={livechatShowAgentInfo}>{t('Show_agent_info')}</AppearanceFieldLabel>
							<Controller
								name='Livechat_show_agent_info'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatShowAgentInfo} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel htmlFor={livechatShowAgentEmail}>{t('Show_agent_email')}</AppearanceFieldLabel>
							<Controller
								name='Livechat_show_agent_email'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatShowAgentEmail} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</AccordionItem>

			<AccordionItem title={t('Livechat_offline')}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel htmlFor={livechatDisplayOfflineForm}>{t('Display_offline_form')}</AppearanceFieldLabel>
							<Controller
								name='Livechat_display_offline_form'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatDisplayOfflineForm} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineFormUnavailableField}>
							{t('Offline_form_unavailable_message')}
						</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_form_unavailable'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineFormUnavailableField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineMessageField}>{t('Offline_message')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_message'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineMessageField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineTitleField}>{t('Title_offline')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_title'
								control={control}
								render={({ field }) => <TextInput id={livechatOfflineTitleField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineTitleColorField}>{t('Title_bar_color_offline')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_title_color'
								control={control}
								render={({ field }) => <InputBox id={livechatOfflineTitleColorField} {...field} type='color' />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineEmailField}>{t('Email_address_to_send_offline_messages')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_email'
								control={control}
								render={({ field }) => <TextInput id={livechatOfflineEmailField} {...field} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatOfflineSuccessMessageField}>{t('Offline_success_message')}</AppearanceFieldLabel>
						<FieldRow>
							<Controller
								name='Livechat_offline_success_message'
								control={control}
								render={({ field }) => <TextAreaInput id={livechatOfflineSuccessMessageField} {...field} rows={3} />}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</AccordionItem>

			<AccordionItem title={t('Livechat_registration_form')}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel htmlFor={livechatRegistrationForm}>{t('Enabled')}</AppearanceFieldLabel>
							<Controller
								name='Livechat_registration_form'
								control={control}
								render={({ field: { value, ...field } }) => <ToggleSwitch id={livechatRegistrationForm} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<AppearanceFieldLabel htmlFor={livechatNameFieldRegistrationForm}>{t('Show_name_field')}</AppearanceFieldLabel>
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
							<AppearanceFieldLabel htmlFor={livechatEmailFieldRegistrationForm}>{t('Show_email_field')}</AppearanceFieldLabel>
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
						<AppearanceFieldLabel htmlFor={livechatRegistrationFormMessageField}>
							{t('Livechat_registration_form_message')}
						</AppearanceFieldLabel>
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
			</AccordionItem>

			<AccordionItem title={t('Conversation_finished')}>
				<FieldGroup>
					<Field>
						<AppearanceFieldLabel htmlFor={livechatConversationFinishedMessageField}>
							{t('Conversation_finished_message')}
						</AppearanceFieldLabel>
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
						<AppearanceFieldLabel htmlFor={livechatConversationFinishedTextField}>{t('Conversation_finished_text')}</AppearanceFieldLabel>
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
			</AccordionItem>
		</Accordion>
	);
};

export default AppearanceForm;
