import React, { useCallback, useState } from 'react';
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
	Margins,
	Icon,
} from '@rocket.chat/fuselage';

import { AutoCompleteDepartment } from '../../../components/AutoCompleteDepartment';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import Page from '../../../components/Page';
import { useForm } from '../../../hooks/useForm';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { isEmail } from '../../../../app/utils';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { FormSkeleton } from './Skeleton';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';


const initialValues = {
	active: true,
	name: '',
	email: '',
	description: '',
	senderInfo: '',
	department: '',
	// SMTP
	smtpServer: '',
	smtpPort: '',
	smtpUsername: '',
	smtpPassword: '',
	smtpSslTls: false,
	// IMAP
	imapServer: '',
	imapPort: '',
	imapUsername: '',
	imapPassword: '',
	imapSslTls: false,
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const {
		active,
		name,
		email,
		description,
		senderInfo,
		department,
		smtp,
		imap,
	} = data;

	return {
		active: active ?? true,
		name: name ?? '',
		email: email ?? '',
		description: description ?? '',
		senderInfo: senderInfo ?? '',
		department: department ?? '',
		// SMTP
		smtpServer: smtp.server ?? '',
		smtpPort: smtp.port ?? '',
		smtpUsername: smtp.username ?? '',
		smtpPassword: smtp.password ?? '',
		smtpSslTls: smtp.sslTls ?? false,
		// IMAP
		imapServer: imap.server ?? '',
		imapPort: imap.port ?? '',
		imapUsername: imap.username ?? '',
		imapPassword: imap.password ?? '',
		imapSslTls: imap.sslTls ?? false,
	};
};

export function EmailInboxEditWithData({ id }) {
	const t = useTranslation();
	const { value: data, error, phase: state } = useEndpointData(`email-inbox?_id=${ id }`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || !data) {
		return <Box mbs='x16'>{t('EmailInbox_not_found')}</Box>;
	}

	return <EmailInboxForm id={id} data={data} />;
}

export default function EmailInboxForm({ id, data }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const [emailError, setEmailError] = useState();
	const { values, handlers, hasUnsavedChanges } = useForm(getInitialValues(data));

	const {
		handleActive,
		handleName,
		handleEmail,
		handleDescription,
		handleSenderInfo,
		handleDepartment,
		// SMTP
		handleSmtpServer,
		handleSmtpPort,
		handleSmtpUsername,
		handleSmtpPassword,
		handleSmtpSslTls,
		// IMAP
		handleImapServer,
		handleImapPort,
		handleImapUsername,
		handleImapPassword,
		handleImapSslTls,
	} = handlers;
	const {
		active,
		name,
		email,
		description,
		senderInfo,
		department,
		// SMTP
		smtpServer,
		smtpPort,
		smtpUsername,
		smtpPassword,
		smtpSslTls,
		// IMAP
		imapServer,
		imapPort,
		imapUsername,
		imapPassword,
		imapSslTls,
	} = values;

	const router = useRoute('admin-email-inboxes');

	const close = useCallback(() => router.push({}), [router]);

	const saveEmailInbox = useEndpointAction('POST', 'email-inbox');
	const deleteAction = useEndpointAction('DELETE', `email-inbox?_id=${ id }`);

	useComponentDidUpdate(() => {
		setEmailError(!isEmail(email) ? t('Validate_email_address') : '');
	}, [t, email]);

	const handleRemoveClick = useMutableCallback(async () => {
		const result = await deleteAction();
		if (result.success === true) {
			close();
		}
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteManager = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal
			onDelete={onDeleteManager}
			onCancel={() => setModal()}
		>{t('You_will_not_be_able_to_recover_email_inbox')}</DeleteWarningModal>);
	});

	const handleSave = useMutableCallback(async () => {
		const smtp = { server: smtpServer, port: smtpPort, username: smtpUsername, password: smtpPassword, sslTls: smtpSslTls };
		const imap = { server: imapServer, port: imapPort, username: imapUsername, password: imapPassword, sslTls: imapSslTls };
		const payload = { active, name, email, description, senderInfo, department, smtp, imap };
		if (id) {
			payload._id = id;
		}
		try {
			await saveEmailInbox(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			close();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	});

	const canSave = hasUnsavedChanges && name && (email && isEmail(email))
	&& smtpServer && smtpPort && smtpUsername && smtpPassword
	&& imapServer && imapPort && imapUsername && imapPassword;

	return <Page.ScrollableContentWithShadow>
		<Box maxWidth='x600' w='full' alignSelf='center'>
			<Accordion>
				<Accordion.Item defaultExpanded title={t('Inbox_Info')}>
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
								<TextInput error={emailError} value={email} onChange={handleEmail} addon={<Icon name='mail' size='x20' />}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
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
							<Field.Label>{t('Department')}</Field.Label>
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
								<TextInput value={smtpServer} onChange={handleSmtpServer} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Port')}*</Field.Label>
							<Field.Row>
								<TextInput value={smtpPort} onChange={handleSmtpPort} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Username')}*</Field.Label>
							<Field.Row>
								<TextInput value={smtpUsername} onChange={handleSmtpUsername} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Password')}*</Field.Label>
							<Field.Row>
								<TextInput type='password' value={smtpPassword} onChange={handleSmtpPassword} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Connect_SSL_TLS')}
								<ToggleSwitch checked={smtpSslTls} onChange={handleSmtpSslTls}/>
							</Field.Label>
						</Field>
					</FieldGroup>
				</Accordion.Item>
				<Accordion.Item title={t('Configure_Incoming_Mail_IMAP')}>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Server')}*</Field.Label>
							<Field.Row>
								<TextInput value={imapServer} onChange={handleImapServer} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Port')}*</Field.Label>
							<Field.Row>
								<TextInput value={imapPort} onChange={handleImapPort} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Username')}*</Field.Label>
							<Field.Row>
								<TextInput value={imapUsername} onChange={handleImapUsername}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Password')}*</Field.Label>
							<Field.Row>
								<TextInput type='password' value={imapPassword} onChange={handleImapPassword} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Connect_SSL_TLS')}
								<ToggleSwitch checked={imapSslTls} onChange={handleImapSslTls} />
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
					<Field.Row>
						<Margins blockStart='x16'>
							<ButtonGroup stretch w='full'>
								{id && <Button primary danger onClick={handleDelete}>{t('Delete')}</Button>}
							</ButtonGroup>
						</Margins>
					</Field.Row>
				</Field>
			</Accordion>
		</Box>
	</Page.ScrollableContentWithShadow>;
}
