import {
	Box,
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
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, FormEvent } from 'react';
import React from 'react';

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
						<FieldLabel>{t('Title')}</FieldLabel>
						<FieldRow>
							<TextInput value={Livechat_title} onChange={handleLivechat_title} placeholder={t('Title')} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Title_bar_color')}</FieldLabel>
						<FieldRow>
							<InputBox type='color' value={Livechat_title_color} onChange={handleLivechat_title_color} />
						</FieldRow>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Message_Characther_Limit')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_enable_message_character_limit} onChange={handleLivechat_enable_message_character_limit} />
							</FieldRow>
						</Box>
						<FieldRow>
							<NumberInput
								disabled={!Livechat_enable_message_character_limit}
								value={Livechat_message_character_limit}
								onChange={onChangeCharacterLimit}
							/>
						</FieldRow>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Show_agent_info')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_show_agent_info} onChange={handleLivechat_show_agent_info} />
							</FieldRow>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Show_agent_email')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_show_agent_email} onChange={handleLivechat_show_agent_email} />
							</FieldRow>
						</Box>
					</Field>
				</FieldGroup>
			</Accordion.Item>

			<Accordion.Item title={t('Livechat_offline')}>
				<FieldGroup>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Display_offline_form')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_display_offline_form} onChange={handleLivechat_display_offline_form} />
							</FieldRow>
						</Box>
					</Field>
					<Field>
						<FieldLabel>{t('Offline_form_unavailable_message')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_form_unavailable}
								onChange={handleLivechat_offline_form_unavailable}
								placeholder={t('Offline_form_unavailable_message')}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Offline_message')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_message}
								onChange={handleLivechat_offline_message}
								placeholder={t('Offline_message')}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Title_offline')}</FieldLabel>
						<FieldRow>
							<TextInput value={Livechat_offline_title} onChange={handleLivechat_offline_title} placeholder={t('Title_offline')} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Title_bar_color_offline')}</FieldLabel>
						<FieldRow>
							<InputBox type='color' value={Livechat_offline_title_color} onChange={handleLivechat_offline_title_color} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Email_address_to_send_offline_messages')}</FieldLabel>
						<FieldRow>
							<TextInput
								value={Livechat_offline_email}
								onChange={handleLivechat_offline_email}
								placeholder={t('Email_address_to_send_offline_messages')}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Offline_success_message')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_offline_success_message}
								onChange={handleLivechat_offline_success_message}
								placeholder={t('Offline_success_message')}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>

			<Accordion.Item title={t('Livechat_registration_form')}>
				<FieldGroup>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Enabled')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_registration_form} onChange={handleLivechat_registration_form} />
							</FieldRow>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Show_name_field')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_name_field_registration_form} onChange={handleLivechat_name_field_registration_form} />
							</FieldRow>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row'>
							<FieldLabel>{t('Show_email_field')}</FieldLabel>
							<FieldRow>
								<ToggleSwitch checked={Livechat_email_field_registration_form} onChange={handleLivechat_email_field_registration_form} />
							</FieldRow>
						</Box>
					</Field>
					<Field>
						<FieldLabel>{t('Livechat_registration_form_message')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_registration_form_message}
								onChange={handleLivechat_registration_form_message}
								placeholder={t('Offline_message')}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
			<Accordion.Item title={t('Conversation_finished')}>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Conversation_finished_message')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_conversation_finished_message}
								onChange={handleLivechat_conversation_finished_message}
								placeholder={t('Offline_message')}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Conversation_finished_text')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								rows={3}
								value={Livechat_conversation_finished_text}
								onChange={handleLivechat_conversation_finished_text}
								placeholder={t('Offline_message')}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Accordion.Item>
		</Accordion>
	);
};

export default AppearanceForm;
