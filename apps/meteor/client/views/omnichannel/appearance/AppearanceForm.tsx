import { Box, Field, TextInput, ToggleSwitch, Accordion, FieldGroup, InputBox, TextAreaInput, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, FormEvent } from 'react';

type AppearanceFormProps = {
	values: {
		Livechat_title?: string;
		Livechat_title_color?: string;
		Livechat_show_agent_info?: boolean;
		Livechat_show_agent_email?: boolean;
		Livechat_display_offline_form?: boolean;
		Livechat_offline_form_unavailable?: string;
		Livechat_offline_message?: string;
		Livechat_offline_title?: string;
		Livechat_offline_title_color?: string;
		Livechat_offline_email?: string;
		Livechat_offline_success_message?: string;
		Livechat_registration_form?: boolean;
		Livechat_name_field_registration_form?: boolean;
		Livechat_email_field_registration_form?: boolean;
		Livechat_registration_form_message?: string;
		Livechat_conversation_finished_message?: string;
		Livechat_conversation_finished_text?: string;
		Livechat_enable_message_character_limit?: boolean;
		Livechat_message_character_limit?: number;
	};
	handlers: {
		handleLivechat_title?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_title_color?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_show_agent_info?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_show_agent_email?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_display_offline_form?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_form_unavailable?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_message?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_title?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_title_color?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_email?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_offline_success_message?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_registration_form?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_name_field_registration_form?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_email_field_registration_form?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_registration_form_message?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_conversation_finished_message?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_conversation_finished_text?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_enable_message_character_limit?: (event: FormEvent<HTMLInputElement>) => void;
		handleLivechat_message_character_limit?: (value: number) => void;
	};
};

const AppearanceForm: FC<AppearanceFormProps> = ({ values = {}, handlers = {} }) => {
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
		Livechat_enable_message_character_limit,
		Livechat_message_character_limit,
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
		handleLivechat_enable_message_character_limit,
		handleLivechat_message_character_limit,
	} = handlers;

	const onChangeCharacterLimit = useMutableCallback(({ currentTarget: { value } }) => {
		handleLivechat_message_character_limit?.(Number(value) < 0 ? 0 : value);
	});

	return (
		<Accordion>
			<Accordion.Item defaultExpanded title={t('Livechat_online')}>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Title')}</Field.Label>
						<Field.Row>
							<TextInput value={Livechat_title} onChange={handleLivechat_title} placeholder={t('Title')} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Title_bar_color')}</Field.Label>
						<Field.Row>
							<InputBox type='color' value={Livechat_title_color} onChange={handleLivechat_title_color} />
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Message_Characther_Limit')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_enable_message_character_limit} onChange={handleLivechat_enable_message_character_limit} />
							</Field.Row>
						</Box>
						<Field.Row>
							<NumberInput
								disabled={!Livechat_enable_message_character_limit}
								value={Livechat_message_character_limit}
								onChange={onChangeCharacterLimit}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Show_agent_info')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_show_agent_info} onChange={handleLivechat_show_agent_info} />
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Show_agent_email')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_show_agent_email} onChange={handleLivechat_show_agent_email} />
							</Field.Row>
						</Box>
					</Field>
				</FieldGroup>
			</Accordion.Item>

			<Accordion.Item title={t('Livechat_offline')}>
				<FieldGroup>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Display_offline_form')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_display_offline_form} onChange={handleLivechat_display_offline_form} />
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Field.Label>{t('Offline_form_unavailable_message')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_form_unavailable}
								onChange={handleLivechat_offline_form_unavailable}
								placeholder={t('Offline_form_unavailable_message')}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Offline_message')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_message}
								onChange={handleLivechat_offline_message}
								placeholder={t('Offline_message')}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Title_offline')}</Field.Label>
						<Field.Row>
							<TextInput value={Livechat_offline_title} onChange={handleLivechat_offline_title} placeholder={t('Title_offline')} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Title_bar_color_offline')}</Field.Label>
						<Field.Row>
							<InputBox type='color' value={Livechat_offline_title_color} onChange={handleLivechat_offline_title_color} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Email_address_to_send_offline_messages')}</Field.Label>
						<Field.Row>
							<TextInput
								value={Livechat_offline_email}
								onChange={handleLivechat_offline_email}
								placeholder={t('Email_address_to_send_offline_messages')}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Offline_success_message')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_success_message}
								onChange={handleLivechat_offline_success_message}
								placeholder={t('Offline_success_message')}
							/>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Accordion.Item>

			<Accordion.Item title={t('Livechat_registration_form')}>
				<FieldGroup>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Enabled')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_registration_form} onChange={handleLivechat_registration_form} />
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Show_name_field')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_name_field_registration_form} onChange={handleLivechat_name_field_registration_form} />
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<Field.Label>{t('Show_email_field')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={Livechat_email_field_registration_form} onChange={handleLivechat_email_field_registration_form} />
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Field.Label>{t('Livechat_registration_form_message')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_registration_form_message}
								onChange={handleLivechat_registration_form_message}
								placeholder={t('Offline_message')}
							/>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Accordion.Item>
			<Accordion.Item title={t('Conversation_finished')}>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Conversation_finished_message')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_conversation_finished_message}
								onChange={handleLivechat_conversation_finished_message}
								placeholder={t('Offline_message')}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Conversation_finished_text')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								value={Livechat_conversation_finished_text}
								onChange={handleLivechat_conversation_finished_text}
								placeholder={t('Offline_message')}
							/>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Accordion.Item>
		</Accordion>
	);
};

export default AppearanceForm;
