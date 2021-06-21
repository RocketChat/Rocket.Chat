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
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState } from 'react';

import { isEmail } from '../../../../app/utils/client';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import Page from '../../../components/Page';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';

const initialValues = {
	active: true,
	name: '',
	email: '',
	description: '',
	senderInfo: '',
	department: '',
	// SMTP
	smtpServer: '',
	smtpPort: 587,
	smtpUsername: '',
	smtpPassword: '',
	smtpSecure: false,
	// IMAP
	imapServer: '',
	imapPort: 993,
	imapUsername: '',
	imapPassword: '',
	imapSecure: false,
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const { active, name, email, description, senderInfo, department, smtp, imap } = data;

	return {
		active: active ?? true,
		name: name ?? '',
		email: email ?? '',
		description: description ?? '',
		senderInfo: senderInfo ?? '',
		department: department ?? '',
		// SMTP
		smtpServer: smtp.server ?? '',
		smtpPort: smtp.port ?? 587,
		smtpUsername: smtp.username ?? '',
		smtpPassword: smtp.password ?? '',
		smtpSecure: smtp.secure ?? false,
		// IMAP
		imapServer: imap.server ?? '',
		imapPort: imap.port ?? 993,
		imapUsername: imap.username ?? '',
		imapPassword: imap.password ?? '',
		imapSecure: imap.secure ?? false,
	};
};

function EmailInboxForm({ id, data }) {
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
		handleSmtpSecure,
		// IMAP
		handleImapServer,
		handleImapPort,
		handleImapUsername,
		handleImapPassword,
		handleImapSecure,
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
		smtpSecure,
		// IMAP
		imapServer,
		imapPort,
		imapUsername,
		imapPassword,
		imapSecure,
	} = values;

	const router = useRoute('admin-email-inboxes');

	const close = useCallback(() => router.push({}), [router]);

	const saveEmailInbox = useEndpointAction('POST', 'email-inbox');
	const deleteAction = useEndpointAction('DELETE', `email-inbox/${id}`);
	const emailAlreadyExistsAction = useEndpointAction('GET', `email-inbox.search?email=${email}`);

	useComponentDidUpdate(() => {
		setEmailError(!isEmail(email) ? t('Validate_email_address') : null);
	}, [t, email]);
	useComponentDidUpdate(() => {
		!email && setEmailError(null);
	}, [email]);

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

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteManager}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			>
				{t('You_will_not_be_able_to_recover_email_inbox')}
			</GenericModal>,
		);
	});

	const handleSave = useMutableCallback(async () => {
		const smtp = {
			server: smtpServer,
			port: parseInt(smtpPort),
			username: smtpUsername,
			password: smtpPassword,
			secure: smtpSecure,
		};
		const imap = {
			server: imapServer,
			port: parseInt(imapPort),
			username: imapUsername,
			password: imapPassword,
			secure: imapSecure,
		};
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

	const checkEmailExists = useMutableCallback(async () => {
		if (!email && !isEmail(email)) {
			return;
		}
		const { emailInbox } = await emailAlreadyExistsAction();

		if (!emailInbox || (id && emailInbox._id === id)) {
			return;
		}
		setEmailError(t('Email_already_exists'));
	});

	const canSave =
		hasUnsavedChanges &&
		name &&
		email &&
		isEmail(email) &&
		!emailError &&
		smtpServer &&
		smtpPort &&
		smtpUsername &&
		smtpPassword &&
		imapServer &&
		imapPort &&
		imapUsername &&
		imapPassword;

	return (
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<Accordion>
					<Accordion.Item defaultExpanded title={t('Inbox_Info')}>
						<FieldGroup>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Active')}
									<ToggleSwitch checked={active} onChange={handleActive} />
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
									<TextInput
										onBlur={checkEmailExists}
										error={emailError}
										value={email}
										onChange={handleEmail}
									/>
								</Field.Row>
								<Field.Error>{t(emailError)}</Field.Error>
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
									<TextInput
										value={senderInfo}
										onChange={handleSenderInfo}
										placeholder={t('Optional')}
									/>
								</Field.Row>
								<Field.Hint>{t('Will_Appear_In_From')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{t('Department')}</Field.Label>
								<Field.Row>
									<AutoCompleteDepartment value={department} onChange={handleDepartment} />
								</Field.Row>
								<Field.Hint>{t('Only_Members_Selected_Department_Can_View_Channel')}</Field.Hint>
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
									<TextInput type='number' value={smtpPort} onChange={handleSmtpPort} />
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
									<ToggleSwitch checked={smtpSecure} onChange={handleSmtpSecure} />
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
									<TextInput type='number' value={imapPort} onChange={handleImapPort} />
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Username')}*</Field.Label>
								<Field.Row>
									<TextInput value={imapUsername} onChange={handleImapUsername} />
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
									<ToggleSwitch checked={imapSecure} onChange={handleImapSecure} />
								</Field.Label>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Field>
						<Field.Row>
							<ButtonGroup stretch w='full'>
								<Button onClick={close}>{t('Cancel')}</Button>
								<Button disabled={!canSave} primary onClick={handleSave}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</Field.Row>
						<Field.Row>
							<Margins blockStart='x16'>
								<ButtonGroup stretch w='full'>
									{id && (
										<Button primary danger onClick={handleDelete}>
											{t('Delete')}
										</Button>
									)}
								</ButtonGroup>
							</Margins>
						</Field.Row>
					</Field>
				</Accordion>
			</Box>
		</Page.ScrollableContentWithShadow>
	);
}

export default EmailInboxForm;
