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
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
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
	const deleteInboxAction = useEndpoint('DELETE', '/v1/email-inbox/:_id', { _id: inboxData?._id ?? '' });
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
								<FieldLabel display='flex' justifyContent='space-between' w='full'>
									{t('Active')}
									<Controller
										control={control}
										name='active'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</FieldLabel>
							</Field>
							<Field>
								<FieldLabel>{t('Name')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('name', { required: t('error-the-field-is-required', { field: t('Name') }) })}
										error={errors.name?.message}
									/>
								</FieldRow>
								{errors.name && <FieldError>{errors.name?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Email')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('email', {
											required: t('error-the-field-is-required', { field: t('Email') }),
											validate: (value) => checkEmailExists(value),
										})}
										error={errors.email?.message}
									/>
								</FieldRow>
								{errors.email && <FieldError>{errors.email?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Description')}</FieldLabel>
								<FieldRow>
									<TextAreaInput {...register('description')} rows={4} />
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Sender_Info')}</FieldLabel>
								<FieldRow>
									<TextInput {...register('senderInfo')} placeholder={t('Optional')} />
								</FieldRow>
								<FieldHint>{t('Will_Appear_In_From')}</FieldHint>
							</Field>
							<Field>
								<FieldLabel>{t('Department')}</FieldLabel>
								<FieldRow>
									<Controller
										control={control}
										name='department'
										render={({ field: { onChange, value } }): ReactElement => <AutoCompleteDepartment value={value} onChange={onChange} />}
									/>
								</FieldRow>
								<FieldHint>{t('Only_Members_Selected_Department_Can_View_Channel')}</FieldHint>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={!inboxData?._id} title={t('Configure_Outgoing_Mail_SMTP')}>
						<FieldGroup>
							<Field>
								<FieldLabel>{t('Server')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('smtpServer', { required: t('error-the-field-is-required', { field: t('Server') }) })}
										error={errors.smtpServer?.message}
									/>
								</FieldRow>
								{errors.smtpServer && <FieldError>{errors.smtpServer?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Port')}*</FieldLabel>
								<FieldRow>
									<NumberInput
										{...register('smtpPort', { required: t('error-the-field-is-required', { field: t('Port') }) })}
										error={errors.smtpPort?.message}
									/>
								</FieldRow>
								{errors.smtpPort && <FieldError>{errors.smtpPort?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Username')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('smtpUsername', { required: t('error-the-field-is-required', { field: t('Username') }) })}
										error={errors.smtpUsername?.message}
									/>
								</FieldRow>
								{errors.smtpUsername && <FieldError>{errors.smtpUsername?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Password')}*</FieldLabel>
								<FieldRow>
									<PasswordInput
										{...register('smtpPassword', { required: t('error-the-field-is-required', { field: t('Password') }) })}
										error={errors.smtpPassword?.message}
									/>
								</FieldRow>
								{errors.smtpPassword && <FieldError>{errors.smtpPassword?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel display='flex' justifyContent='space-between' w='full'>
									{t('Connect_SSL_TLS')}
									<Controller
										control={control}
										name='smtpSecure'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</FieldLabel>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={!inboxData?._id} title={t('Configure_Incoming_Mail_IMAP')}>
						<FieldGroup>
							<Field>
								<FieldLabel>{t('Server')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('imapServer', { required: t('error-the-field-is-required', { field: t('Server') }) })}
										error={errors.imapServer?.message}
									/>
								</FieldRow>
								{errors.imapServer && <FieldError>{errors.imapServer?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Port')}*</FieldLabel>
								<FieldRow>
									<NumberInput
										{...register('imapPort', { required: t('error-the-field-is-required', { field: t('Port') }) })}
										error={errors.imapPort?.message}
									/>
								</FieldRow>
								{errors.imapPort && <FieldError>{errors.imapPort?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Username')}*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('imapUsername', { required: t('error-the-field-is-required', { field: t('Username') }) })}
										error={errors.imapUsername?.message}
									/>
								</FieldRow>
								{errors.imapUsername && <FieldError>{errors.imapUsername?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Password')}*</FieldLabel>
								<FieldRow>
									<PasswordInput
										{...register('imapPassword', { required: t('error-the-field-is-required', { field: t('Password') }) })}
										error={errors.imapPassword?.message}
									/>
								</FieldRow>
								{errors.imapPassword && <FieldError>{errors.imapPassword?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel>{t('Max_Retry')}*</FieldLabel>
								<FieldRow>
									<NumberInput
										{...register('imapRetries', { required: t('error-the-field-is-required', { field: t('Max_Retry') }) })}
										error={errors.imapRetries?.message}
									/>
								</FieldRow>
								{errors.imapRetries && <FieldError>{errors.imapRetries?.message}</FieldError>}
							</Field>
							<Field>
								<FieldLabel display='flex' justifyContent='space-between' w='full'>
									{t('Connect_SSL_TLS')}
									<Controller
										control={control}
										name='imapSecure'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</FieldLabel>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Field>
						<FieldRow>
							<ButtonGroup stretch w='full'>
								<Button onClick={handleBack}>{t('Cancel')}</Button>
								<Button disabled={!isDirty} primary onClick={handleSubmit(handleSave)}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</FieldRow>
						<FieldRow>
							<Margins blockStart={16}>
								<ButtonGroup stretch w='full'>
									{inboxData?._id && (
										<Button danger onClick={handleDelete}>
											{t('Delete')}
										</Button>
									)}
								</ButtonGroup>
							</Margins>
						</FieldRow>
					</Field>
				</Accordion>
			</Box>
		</Page.ScrollableContentWithShadow>
	);
};

export default EmailInboxForm;
