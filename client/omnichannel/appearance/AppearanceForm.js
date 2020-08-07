import React from 'react';
import { Box, Field, TextInput, ToggleSwitch, Accordion, FieldGroup, InputBox, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

const AppearanceForm = ({ values = {}, handlers = {} }) => {
	const t = useTranslation();

	const {
		Livechat_title,
		Livechat_title_color,
		Livechat_show_agent_info,
		Livechat_show_agent_email,
		Livechat_display_offline_form,
		Livechat_offline_form_unavailable,
		Livechat_offline_message,
		Livechat_offline_title,
		Livechat_offline_title_color,
		Livechat_offline_email,
		Livechat_offline_success_message,
		Livechat_registration_form,
		Livechat_name_field_registration_form,
		Livechat_email_field_registration_form,
		Livechat_registration_form_message,
		Livechat_conversation_finished_message,
		Livechat_conversation_finished_text,
	} = values;

	const {
		handleLivechat_title,
		handleLivechat_title_color,
		handleLivechat_show_agent_info,
		handleLivechat_show_agent_email,
		handleLivechat_display_offline_form,
		handleLivechat_offline_form_unavailable,
		handleLivechat_offline_message,
		handleLivechat_offline_title,
		handleLivechat_offline_title_color,
		handleLivechat_offline_email,
		handleLivechat_offline_success_message,
		handleLivechat_registration_form,
		handleLivechat_name_field_registration_form,
		handleLivechat_email_field_registration_form,
		handleLivechat_registration_form_message,
		handleLivechat_conversation_finished_message,
		handleLivechat_conversation_finished_text,
	} = handlers;

	return <Accordion>
		<Accordion.Item defaultExpanded title={t('Livechat_online')}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Title')}</Field.Label>
					<Field.Row>
						<TextInput value={Livechat_title} onChange={handleLivechat_title} placeholder={t('Title')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Title_bar_color')}</Field.Label>
					<Field.Row>
						<InputBox type='color' value={Livechat_title_color} onChange={handleLivechat_title_color}/>
					</Field.Row>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Show_agent_info')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_show_agent_info} onChange={handleLivechat_show_agent_info}/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Show_agent_email')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_show_agent_email} onChange={handleLivechat_show_agent_email}/>
						</Field.Row>
					</Box>
				</Field>
			</FieldGroup>
		</Accordion.Item>

		<Accordion.Item title={t('Livechat_offline')}>
			<FieldGroup>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Display_offline_form')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_display_offline_form} onChange={handleLivechat_display_offline_form}/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Field.Label>{t('Offline_form_unavailable_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_offline_form_unavailable} onChange={handleLivechat_offline_form_unavailable} placeholder={t('Offline_form_unavailable_message')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Offline_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_offline_message} onChange={handleLivechat_offline_message} placeholder={t('Offline_message')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Title_offline')}</Field.Label>
					<Field.Row>
						<TextInput value={Livechat_offline_title} onChange={handleLivechat_offline_title} placeholder={t('Title_offline')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Title_bar_color_offline')}</Field.Label>
					<Field.Row>
						<InputBox type='color' value={Livechat_offline_title_color} onChange={handleLivechat_offline_title_color}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email_address_to_send_offline_messages')}</Field.Label>
					<Field.Row>
						<TextInput value={Livechat_offline_email} onChange={handleLivechat_offline_email} placeholder={t('Email_address_to_send_offline_messages')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Offline_success_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_offline_success_message} onChange={handleLivechat_offline_success_message} placeholder={t('Offline_success_message')}/>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>

		<Accordion.Item title={t('Livechat_registration_form')}>
			<FieldGroup>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Enabled')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_registration_form} onChange={handleLivechat_registration_form}/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Show_name_field')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_name_field_registration_form} onChange={handleLivechat_name_field_registration_form}/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row'>
						<Field.Label >{t('Show_email_field')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={Livechat_email_field_registration_form} onChange={handleLivechat_email_field_registration_form}/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Field.Label>{t('Livechat_registration_form_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_registration_form_message} onChange={handleLivechat_registration_form_message} placeholder={t('Offline_message')}/>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
		<Accordion.Item title={t('Conversation_finished')}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Conversation_finished_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_conversation_finished_message} onChange={handleLivechat_conversation_finished_message} placeholder={t('Offline_message')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Conversation_finished_text')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={3} value={Livechat_conversation_finished_text} onChange={handleLivechat_conversation_finished_text} placeholder={t('Offline_message')}/>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	</Accordion>;
};

export default AppearanceForm;
