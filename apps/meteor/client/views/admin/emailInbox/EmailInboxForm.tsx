import type { IEmailInboxPayload } from '@rocket.chat/core-typings';
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
	NumberInput,
	PasswordInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import Page from '../../../components/Page';

const EmailInboxForm = ({ inboxData }: { inboxData?: IEmailInboxPayload }): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const router = useRoute('admin-email-inboxes');

	const handleBack = useCallback(() => router.push({}), [router]);

	const saveEmailInbox = useEndpoint('POST', '/v1/email-inbox');
	const deleteInboxAction = useEndpoint('DELETE', `/v1/email-inbox/${inboxData?._id}`);
	const emailAlreadyExistsAction = useEndpoint('GET', '/v1/email-inbox.search');

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm({
		defaultValues: {
			active: inboxData?.active ?? true,
			name: inboxData?.name,
			email: inboxData?.email,
			description: inboxData?.description,
			senderInfo: inboxData?.senderInfo,
			department: inboxData?.department || '',
			// SMTP
			smtpServer: inboxData?.smtp.server,
			smtpPort: inboxData?.smtp.port ?? 587,
			smtpUsername: inboxData?.smtp.username,
			smtpPassword: inboxData?.smtp.password,
			smtpSecure: inboxData?.smtp.secure ?? false,
			// IMAP
			imapServer: inboxData?.imap.server,
			imapPort: inboxData?.imap.port ?? 993,
			imapUsername: inboxData?.imap.username,
			imapPassword: inboxData?.imap.password,
			imapSecure: inboxData?.imap.secure ?? false,
			imapRetries: inboxData?.imap.maxRetries ?? 10,
		},
	});

	const handleDelete = useMutableCallback(() => {
		const deleteInbox = async (): Promise<void> => {
			try {
				await deleteInboxAction();
				dispatchToastMessage({ type: 'success', message: t('Email_Inbox_has_been_removed') });
				handleBack();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={deleteInbox} onCancel={(): void => setModal(null)} confirmText={t('Delete')}>
				{t('You_will_not_be_able_to_recover_email_inbox')}
			</GenericModal>,
		);
	});

	const handleSave = useMutableCallback(
		async ({
			active,
			name,
			email,
			description,
			senderInfo,
			department,
			smtpServer,
			smtpPort,
			smtpUsername,
			smtpPassword,
			smtpSecure,
			imapServer,
			imapPort,
			imapUsername,
			imapPassword,
			imapSecure,
			imapRetries,
		}) => {
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
				maxRetries: parseInt(imapRetries),
			};

			const payload = {
				...(inboxData?._id && { _id: inboxData?._id }),
				active,
				name,
				email,
				description,
				senderInfo,
				...(department && { department: typeof department === 'string' ? department : department.value }),
				smtp,
				imap,
			};

			try {
				await saveEmailInbox(payload);
				dispatchToastMessage({ type: 'success', message: t('Email_Inbox_has_been_added') });
				handleBack();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
	);

	const checkEmailExists = useMutableCallback(async (email) => {
		if (!email) {
			return;
		}

		if (!validateEmail(email)) {
			return t('Validate_email_address');
		}

		const { emailInbox } = await emailAlreadyExistsAction({ email });

		if (!emailInbox || (inboxData?._id && emailInbox._id === inboxData?._id)) {
			return;
		}

		return t('Email_already_exists');
	});

	return (
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<Accordion>
					<Accordion.Item defaultExpanded title={t('Inbox_Info')}>
						<FieldGroup>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Active')}
									<Controller
										control={control}
										name='active'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Label>
							</Field>
							<Field>
								<Field.Label>{t('Name')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('name', { required: t('error-the-field-is-required', { field: t('Name') }) })}
										error={errors.name?.message}
									/>
								</Field.Row>
								{errors.name && <Field.Error>{errors.name?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Email')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('email', {
											required: t('error-the-field-is-required', { field: t('Email') }),
											validate: (value) => checkEmailExists(value),
										})}
										error={errors.email?.message}
									/>
								</Field.Row>
								{errors.email && <Field.Error>{errors.email?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Description')}</Field.Label>
								<Field.Row>
									<TextAreaInput {...register('description')} rows={4} />
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Sender_Info')}</Field.Label>
								<Field.Row>
									<TextInput {...register('senderInfo')} placeholder={t('Optional')} />
								</Field.Row>
								<Field.Hint>{t('Will_Appear_In_From')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{t('Department')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='department'
										render={({ field: { onChange, value } }): ReactElement => <AutoCompleteDepartment value={value} onChange={onChange} />}
									/>
								</Field.Row>
								<Field.Hint>{t('Only_Members_Selected_Department_Can_View_Channel')}</Field.Hint>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={!inboxData?._id} title={t('Configure_Outgoing_Mail_SMTP')}>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Server')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('smtpServer', { required: t('error-the-field-is-required', { field: t('Server') }) })}
										error={errors.smtpServer?.message}
									/>
								</Field.Row>
								{errors.smtpServer && <Field.Error>{errors.smtpServer?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Port')}*</Field.Label>
								<Field.Row>
									<NumberInput
										{...register('smtpPort', { required: t('error-the-field-is-required', { field: t('Port') }) })}
										error={errors.smtpPort?.message}
									/>
								</Field.Row>
								{errors.smtpPort && <Field.Error>{errors.smtpPort?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Username')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('smtpUsername', { required: t('error-the-field-is-required', { field: t('Username') }) })}
										error={errors.smtpUsername?.message}
									/>
								</Field.Row>
								{errors.smtpUsername && <Field.Error>{errors.smtpUsername?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Password')}*</Field.Label>
								<Field.Row>
									<PasswordInput
										{...register('smtpPassword', { required: t('error-the-field-is-required', { field: t('Password') }) })}
										error={errors.smtpPassword?.message}
									/>
								</Field.Row>
								{errors.smtpPassword && <Field.Error>{errors.smtpPassword?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Connect_SSL_TLS')}
									<Controller
										control={control}
										name='smtpSecure'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Label>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={!inboxData?._id} title={t('Configure_Incoming_Mail_IMAP')}>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Server')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('imapServer', { required: t('error-the-field-is-required', { field: t('Server') }) })}
										error={errors.imapServer?.message}
									/>
								</Field.Row>
								{errors.imapServer && <Field.Error>{errors.imapServer?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Port')}*</Field.Label>
								<Field.Row>
									<NumberInput
										{...register('imapPort', { required: t('error-the-field-is-required', { field: t('Port') }) })}
										error={errors.imapPort?.message}
									/>
								</Field.Row>
								{errors.imapPort && <Field.Error>{errors.imapPort?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Username')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('imapUsername', { required: t('error-the-field-is-required', { field: t('Username') }) })}
										error={errors.imapUsername?.message}
									/>
								</Field.Row>
								{errors.imapUsername && <Field.Error>{errors.imapUsername?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Password')}*</Field.Label>
								<Field.Row>
									<PasswordInput
										{...register('imapPassword', { required: t('error-the-field-is-required', { field: t('Password') }) })}
										error={errors.imapPassword?.message}
									/>
								</Field.Row>
								{errors.imapPassword && <Field.Error>{errors.imapPassword?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Max_Retry')}*</Field.Label>
								<Field.Row>
									<NumberInput
										{...register('imapRetries', { required: t('error-the-field-is-required', { field: t('Max_Retry') }) })}
										error={errors.imapRetries?.message}
									/>
								</Field.Row>
								{errors.imapRetries && <Field.Error>{errors.imapRetries?.message}</Field.Error>}
							</Field>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Connect_SSL_TLS')}
									<Controller
										control={control}
										name='imapSecure'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Label>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Field>
						<Field.Row>
							<ButtonGroup stretch w='full'>
								<Button onClick={handleBack}>{t('Cancel')}</Button>
								<Button disabled={!isDirty} primary onClick={handleSubmit(handleSave)}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</Field.Row>
						<Field.Row>
							<Margins blockStart='x16'>
								<ButtonGroup stretch w='full'>
									{inboxData?._id && (
										<Button danger onClick={handleDelete}>
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
};

export default EmailInboxForm;
