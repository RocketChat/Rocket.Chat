import React, { useCallback } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	Accordion,
	Button,
	ButtonGroup,
	TextInput,
	TextAreaInput,
	Field,
	ToggleSwitch,
	FieldGroup,
	Box,
} from '@rocket.chat/fuselage';

import { AutoCompleteDepartment } from '../../../components/AutoCompleteDepartment';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import Page from '../../../components/Page';
import { useForm } from '../../../hooks/useForm';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { isEmail } from '../../../../app/utils';


const initialValues = {
	active: true,
	name: '',
	email: '',
	description: '',
	senderInfo: '',
	department: '',
	// SMTP
	SMTP_server: '',
	SMTP_port: '',
	SMTP_username: '',
	SMTP_password: '',
	SMTP_SSL_TLS: false,
	// IMAP
	IMAP_server: '',
	IMAP_port: '',
	IMAP_username: '',
	IMAP_password: '',
	IMAP_SSL_TLS: false,
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const { name } = data;

	return {
		name: name ?? '',
	};
};

export default function EmailChannelForm({ data }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers } = useForm(getInitialValues(data));

	const {
		handleActive,
		handleName,
		handleEmail,
		handleDescription,
		handleSenderInfo,
		handleDepartment,
		// SMTP
		handleSMTP_server,
		handleSMTP_port,
		handleSMTP_username,
		handleSMTP_password,
		handleSMTP_SSL_TLS,
		// IMAP
		handleIMAP_server,
		handleIMAP_port,
		handleIMAP_username,
		handleIMAP_password,
		handleIMAP_SSL_TLS,
	} = handlers;
	const {
		active,
		name,
		email,
		description,
		senderInfo,
		department,
		// SMTP
		SMTP_server,
		SMTP_port,
		SMTP_username,
		SMTP_password,
		SMTP_SSL_TLS,
		// IMAP
		IMAP_server,
		IMAP_port,
		IMAP_username,
		IMAP_password,
		IMAP_SSL_TLS,
	} = values;

	const router = useRoute('admin-email-channel');

	const close = useCallback(() => router.push({}), [router]);

	const saveEmailChannel = useEndpointAction('POST', 'email-channel');

	const handleSave = useMutableCallback(async () => {
		const smtp = { server: SMTP_server, port: SMTP_port, username: SMTP_username, password: SMTP_password, sslTls: SMTP_SSL_TLS };
		const imap = { server: IMAP_server, port: IMAP_port, username: IMAP_username, password: IMAP_password, sslTls: IMAP_SSL_TLS };
		const payload = { active, name, email, description, senderInfo, department, smtp, imap };
		try {
			await saveEmailChannel(payload);
			dispatchToastMessage({ type: 'success', message: t('Email_channel_added') });
			close();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	});

	const canSave = name && (email && isEmail(email)) && description && department
	&& SMTP_server && SMTP_port && SMTP_username && SMTP_password
	&& IMAP_server && IMAP_port && IMAP_username && IMAP_password;

	return <Page.ScrollableContentWithShadow>
		<Box maxWidth='x600' w='full' alignSelf='center'>
			<Accordion>
				<Accordion.Item defaultExpanded title={t('Channel_Info')}>
					<FieldGroup>
						<Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Active')}
								<ToggleSwitch checked={active} onChange={handleActive}/>
							</Field.Label>
						</Field>
						<Field>
							<Field.Label>{t('Name')}*</Field.Label>
							<Field.Row>
								<TextInput value={name} onChange={handleName} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Email')}*</Field.Label>
							<Field.Row>
								<TextInput value={email} onChange={handleEmail} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Description')}*</Field.Label>
							<Field.Row>
								<TextAreaInput value={description} rows={4} onChange={handleDescription} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Sender_Info')}</Field.Label>
							<Field.Row>
								<TextInput value={senderInfo} onChange={handleSenderInfo} placeholder={t('Optional')} />
							</Field.Row>
							<Field.Hint>
								{t('Will_Appear_In_From')}
							</Field.Hint>
						</Field>
						<Field>
							<Field.Label>{t('Department')}*</Field.Label>
							<Field.Row>
								<AutoCompleteDepartment value={department} onChange={handleDepartment} />
							</Field.Row>
							<Field.Hint>
								{t('Only_Members_Selected_Department_Can_View_Channel')}
							</Field.Hint>
						</Field>
					</FieldGroup>
				</Accordion.Item>
				<Accordion.Item title={t('Configure_Outgoing_Mail_SMTP')}>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Server')}*</Field.Label>
							<Field.Row>
								<TextInput value={SMTP_server} onChange={handleSMTP_server} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Port')}*</Field.Label>
							<Field.Row>
								<TextInput value={SMTP_port} onChange={handleSMTP_port} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Username')}*</Field.Label>
							<Field.Row>
								<TextInput value={SMTP_username} onChange={handleSMTP_username} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Password')}*</Field.Label>
							<Field.Row>
								<TextInput type='password' value={SMTP_password} onChange={handleSMTP_password} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Connect_SSL_TLS')}
								<ToggleSwitch checked={SMTP_SSL_TLS} onChange={handleSMTP_SSL_TLS}/>
							</Field.Label>
						</Field>
					</FieldGroup>
				</Accordion.Item>
				<Accordion.Item title={t('Configure_Incoming_Mail_IMAP')}>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Server')}*</Field.Label>
							<Field.Row>
								<TextInput value={IMAP_server} onChange={handleIMAP_server} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Port')}*</Field.Label>
							<Field.Row>
								<TextInput value={IMAP_port} onChange={handleIMAP_port} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Username')}*</Field.Label>
							<Field.Row>
								<TextInput value={IMAP_username} onChange={handleIMAP_username}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Password')}*</Field.Label>
							<Field.Row>
								<TextInput type='password' value={IMAP_password} onChange={handleIMAP_password} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Connect_SSL_TLS')}
								<ToggleSwitch checked={IMAP_SSL_TLS} onChange={handleIMAP_SSL_TLS} />
							</Field.Label>
						</Field>
					</FieldGroup>
				</Accordion.Item>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button disabled={!canSave} primary onClick={handleSave}>{t('Save')}</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</Accordion>
		</Box>
	</Page.ScrollableContentWithShadow>;
}
