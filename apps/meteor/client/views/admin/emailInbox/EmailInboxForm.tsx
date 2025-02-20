import type { IEmailInboxPayload } from '@rocket.chat/core-typings';
import {
	Accordion,
	AccordionItem,
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
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validateEmail } from '../../../../lib/emailValidator';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import { PageScrollableContentWithShadow } from '../../../components/Page';

type EmailInboxFormData = {
	active: boolean;
	name: string;
	email: string;
	description?: string;
	senderInfo?: string;
	department?: string;
	smtpServer: string;
	smtpPort: string;
	smtpUsername: string;
	smtpPassword: string;
	smtpSecure: boolean;
	imapServer: string;
	imapPort: string;
	imapUsername: string;
	imapPassword: string;
	imapSecure: boolean;
	imapRetries: string;
};

type EmailInboxFormProps = {
	inboxData?: IEmailInboxPayload;
};

const EmailInboxForm = ({ inboxData }: EmailInboxFormProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const router = useRoute('admin-email-inboxes');

	const handleBack = useCallback(() => router.push({}), [router]);

	const saveEmailInbox = useEndpoint('POST', '/v1/email-inbox');
	const deleteInboxAction = useEndpoint('DELETE', '/v1/email-inbox/:_id', { _id: inboxData?._id ?? '' });
	const emailAlreadyExistsAction = useEndpoint('GET', '/v1/email-inbox.search');

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm<EmailInboxFormData>({
		values: {
			active: inboxData?.active ?? true,
			name: inboxData?.name ?? '',
			email: inboxData?.email ?? '',
			description: inboxData?.description,
			senderInfo: inboxData?.senderInfo,
			department: inboxData?.department,
			// SMTP
			smtpServer: inboxData?.smtp.server ?? '',
			smtpPort: String(inboxData?.smtp.port ?? 587),
			smtpUsername: inboxData?.smtp.username ?? '',
			smtpPassword: inboxData?.smtp.password ?? '',
			smtpSecure: inboxData?.smtp.secure ?? false,
			// IMAP
			imapServer: inboxData?.imap.server ?? '',
			imapPort: String(inboxData?.imap.port ?? 993),
			imapUsername: inboxData?.imap.username ?? '',
			imapPassword: inboxData?.imap.password ?? '',
			imapSecure: inboxData?.imap.secure ?? false,
			imapRetries: String(inboxData?.imap.maxRetries ?? 10),
		},
		mode: 'all',
	});

	const handleDelete = useEffectEvent(() => {
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

	const handleSave = useEffectEvent(
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
		}: EmailInboxFormData) => {
			const smtp = {
				server: smtpServer,
				port: parseInt(smtpPort, 10),
				username: smtpUsername,
				password: smtpPassword,
				secure: smtpSecure,
			};

			const imap = {
				server: imapServer,
				port: parseInt(imapPort, 10),
				username: imapUsername,
				password: imapPassword,
				secure: imapSecure,
				maxRetries: parseInt(imapRetries, 10),
			};

			const payload = {
				...(inboxData?._id && { _id: inboxData?._id }),
				active,
				name,
				email,
				description,
				senderInfo,
				...(department && { department }),
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

	const checkEmailExists = useEffectEvent(async (email: string) => {
		if (!email) {
			return;
		}

		if (!validateEmail(email)) {
			return t('error-invalid-email-address');
		}

		const { emailInbox } = await emailAlreadyExistsAction({ email });

		if (!emailInbox || (inboxData?._id && emailInbox._id === inboxData?._id)) {
			return;
		}

		return t('Email_already_exists');
	});

	const activeField = useId();
	const nameField = useId();
	const emailField = useId();
	const descriptionField = useId();
	const senderInfoField = useId();
	const departmentField = useId();

	const smtpServerField = useId();
	const smtpPortField = useId();
	const smtpUsernameField = useId();
	const smtpPasswordField = useId();
	const smtpSecureField = useId();

	const imapServerField = useId();
	const imapPortField = useId();
	const imapUsernameField = useId();
	const imapPasswordField = useId();
	const imapRetriesField = useId();
	const imapSecureField = useId();

	return (
		<PageScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<Accordion>
					<AccordionItem defaultExpanded title={t('Inbox_Info')}>
						<FieldGroup>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={activeField}>{t('Active')}</FieldLabel>
									<Controller
										control={control}
										name='active'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch id={activeField} ref={ref} checked={value} onChange={onChange} />
										)}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={nameField} required>
									{t('Name')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='name'
										control={control}
										rules={{ required: t('Required_field', { field: t('Name') }) }}
										render={({ field }) => (
											<TextInput
												id={nameField}
												{...field}
												error={errors.name?.message}
												aria-required={true}
												aria-invalid={Boolean(errors.name)}
												aria-describedby={`${nameField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors.name && (
									<FieldError aria-live='assertive' id={`${nameField}-error`}>
										{errors.name?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={emailField} required>
									{t('Email')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='email'
										control={control}
										rules={{
											required: t('Required_field', { field: t('Email') }),
											validate: (value) => checkEmailExists(value),
										}}
										render={({ field }) => (
											<TextInput
												{...field}
												id={emailField}
												error={errors.email?.message}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
												aria-describedby={`${emailField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors.email && (
									<FieldError aria-live='assertive' id={`${emailField}-error`}>
										{errors.email?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={descriptionField}>{t('Description')}</FieldLabel>
								<FieldRow>
									<Controller
										name='description'
										control={control}
										render={({ field }) => <TextAreaInput id={descriptionField} {...field} rows={4} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={senderInfoField}>{t('Sender_Info')}</FieldLabel>
								<FieldRow>
									<Controller
										name='senderInfo'
										control={control}
										render={({ field }) => <TextInput id={senderInfoField} {...field} aria-describedby={`${senderInfoField}-hint`} />}
									/>
								</FieldRow>
								<FieldHint id={`${senderInfoField}-hint`}>{t('Will_Appear_In_From')}</FieldHint>
							</Field>
							<Field>
								<FieldLabel htmlFor={departmentField}>{t('Department')}</FieldLabel>
								<FieldRow>
									<Controller
										control={control}
										name='department'
										render={({ field: { onChange, onBlur, name, value } }) => (
											<AutoCompleteDepartment
												id={departmentField}
												name={name}
												onBlur={onBlur}
												value={value}
												onChange={onChange}
												aria-describedby={`${departmentField}-hint`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${departmentField}-hint`}>{t('Only_Members_Selected_Department_Can_View_Channel')}</FieldHint>
							</Field>
						</FieldGroup>
					</AccordionItem>
					<AccordionItem defaultExpanded={!inboxData?._id} title={t('Configure_Outgoing_Mail_SMTP')}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={smtpServerField} required>
									{t('Server')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='smtpServer'
										control={control}
										rules={{ required: t('Required_field', { field: t('Server') }) }}
										render={({ field }) => (
											<TextInput
												id={smtpServerField}
												{...field}
												error={errors.smtpServer?.message}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
												aria-describedby={`${smtpServerField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors.smtpServer && (
									<FieldError aria-live='assertive' id={`${smtpServerField}-error`}>
										{errors.smtpServer?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={smtpPortField} required>
									{t('Port')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='smtpPort'
										control={control}
										rules={{ required: t('Required_field', { field: t('Port') }) }}
										render={({ field }) => (
											<NumberInput
												id={smtpPortField}
												{...field}
												error={errors.smtpPort?.message}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
												aria-describedby={`${smtpPortField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors.smtpPort && (
									<FieldError aria-live='assertive' id={`${smtpPortField}-error`}>
										{errors.smtpPort?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={smtpUsernameField} required>
									{t('Username')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='smtpUsername'
										control={control}
										rules={{ required: t('Required_field', { field: t('Username') }) }}
										render={({ field }) => (
											<TextInput
												id={smtpUsernameField}
												{...field}
												error={errors.smtpUsername?.message}
												aria-describedby={`${smtpUsernameField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.smtpUsername && (
									<FieldError aria-live='assertive' id={`${smtpUsernameField}-error`}>
										{errors.smtpUsername?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={smtpPasswordField} required>
									{t('Password')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='smtpPassword'
										control={control}
										rules={{ required: t('Required_field', { field: t('Password') }) }}
										render={({ field }) => (
											<PasswordInput
												id={smtpPasswordField}
												{...field}
												error={errors.smtpPassword?.message}
												aria-describedby={`${smtpPasswordField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.smtpPassword && (
									<FieldError aria-live='assertive' id={`${smtpPasswordField}-error`}>
										{errors.smtpPassword?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={smtpSecureField}>{t('Connect_SSL_TLS')}</FieldLabel>
									<Controller
										control={control}
										name='smtpSecure'
										render={({ field: { value, ...field } }) => <ToggleSwitch id={smtpSecureField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Field>
						</FieldGroup>
					</AccordionItem>
					<AccordionItem defaultExpanded={!inboxData?._id} title={t('Configure_Incoming_Mail_IMAP')}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={imapServerField} required>
									{t('Server')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='imapServer'
										control={control}
										rules={{ required: t('Required_field', { field: t('Server') }) }}
										render={({ field }) => (
											<TextInput
												id={imapServerField}
												{...field}
												error={errors.imapServer?.message}
												aria-describedby={`${imapServerField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.imapServer && (
									<FieldError aria-live='assertive' id={`${imapServerField}-error`}>
										{errors.imapServer?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={imapPortField} required>
									{t('Port')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='imapPort'
										control={control}
										rules={{ required: t('Required_field', { field: t('Port') }) }}
										render={({ field }) => (
											<NumberInput
												id={imapPortField}
												{...field}
												error={errors.imapPort?.message}
												aria-describedby={`${imapPortField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.imapPort && (
									<FieldError aria-live='assertive' id={`${imapPortField}-error`}>
										{errors.imapPort?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={imapUsernameField} required>
									{t('Username')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='imapUsername'
										control={control}
										rules={{ required: t('Required_field', { field: t('Username') }) }}
										render={({ field }) => (
											<TextInput
												id={imapUsernameField}
												{...field}
												error={errors.imapUsername?.message}
												aria-describedby={`${imapUsernameField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.imapUsername && (
									<FieldError aria-live='assertive' id={`${imapUsernameField}-error`}>
										{errors.imapUsername?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={imapPasswordField} required>
									{t('Password')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='imapPassword'
										control={control}
										rules={{ required: t('Required_field', { field: t('Password') }) }}
										render={({ field }) => (
											<PasswordInput
												id={imapPasswordField}
												{...field}
												error={errors.imapPassword?.message}
												aria-describedby={`${imapPasswordField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.imapPassword && (
									<FieldError aria-live='assertive' id={`${imapPasswordField}-error`}>
										{errors.imapPassword?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={imapRetriesField} required>
									{t('Max_Retry')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='imapRetries'
										control={control}
										rules={{ required: t('Required_field', { field: t('Max_Retry') }) }}
										render={({ field }) => (
											<NumberInput
												id={imapRetriesField}
												{...field}
												error={errors.imapRetries?.message}
												aria-describedby={`${imapRetriesField}-error`}
												aria-required={true}
												aria-invalid={Boolean(errors.email)}
											/>
										)}
									/>
								</FieldRow>
								{errors.imapRetries && (
									<FieldError aria-live='assertive' id={`${imapRetriesField}-error`}>
										{errors.imapRetries?.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={imapSecureField}>{t('Connect_SSL_TLS')}</FieldLabel>
									<Controller
										control={control}
										name='imapSecure'
										render={({ field: { value, ...field } }) => <ToggleSwitch id={imapSecureField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Field>
						</FieldGroup>
					</AccordionItem>
					<Field>
						<FieldRow>
							<ButtonGroup stretch>
								<Button onClick={handleBack}>{t('Cancel')}</Button>
								<Button disabled={!isDirty} primary onClick={handleSubmit(handleSave)}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</FieldRow>
						<FieldRow>
							<Margins blockStart={16}>
								<ButtonGroup stretch>
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
		</PageScrollableContentWithShadow>
	);
};

export default EmailInboxForm;
