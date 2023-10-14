import {
	TextInput,
	TextAreaInput,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	CheckBox,
	Button,
	ButtonGroup,
	Box,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import { isJSON } from '../../../../lib/utils/isJSON';
import Page from '../../../components/Page';

export type SendEmailFormValue = {
	fromEmail: string;
	subject: string;
	emailBody: string;
	dryRun: boolean;
	query?: string;
};

const initialData = { fromEmail: '', query: '', dryRun: false, subject: '', emailBody: '' };

const MailerPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		formState: { errors, isDirty },
		handleSubmit,
		reset,
		control,
	} = useForm({ defaultValues: initialData, mode: 'onBlur' });

	const mailerEndpoint = useEndpoint('POST', '/v1/mailer');
	const sendMailAction = useMutation({
		mutationFn: mailerEndpoint,
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('The_emails_are_being_sent'),
			});
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSendEmail = async ({ fromEmail, subject, emailBody, dryRun, query }: SendEmailFormValue) => {
		sendMailAction.mutateAsync({ from: fromEmail, subject, body: emailBody, dryrun: dryRun, query });
	};

	const mailerFormId = useUniqueId();
	const fromEmailId = useUniqueId();
	const queryId = useUniqueId();
	const dryRunId = useUniqueId();
	const subjectId = useUniqueId();
	const emailBodyId = useUniqueId();

	return (
		<Page>
			<Page.Header title={t('Mailer')} />
			<Page.ScrollableContentWithShadow alignSelf='center' w='100%' display='flex' flexDirection='column' alignItems='center'>
				<Box id={mailerFormId} is='form' autoComplete='off' maxWidth='x600' onSubmit={handleSubmit(handleSendEmail)}>
					<FieldGroup>
						<Field>
							<FieldLabel required htmlFor={fromEmailId}>
								{t('From')}
							</FieldLabel>
							<FieldRow>
								<TextInput
									id={fromEmailId}
									placeholder={t('Type_your_email')}
									{...register('fromEmail', {
										validate: (fromEmail) => (!validateEmail(fromEmail) ? t('Invalid_email') : true),
									})}
									error={errors.fromEmail?.message}
									aria-required='true'
									aria-invalid={errors.fromEmail ? 'true' : 'false'}
									aria-describedby={`${fromEmailId}-error`}
								/>
							</FieldRow>
							{errors.fromEmail && (
								<FieldError aria-live='assertive' id={`${fromEmailId}-error`}>
									{errors.fromEmail.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldRow>
								<Controller
									control={control}
									name='dryRun'
									render={({ field: { ref, value, onChange } }) => (
										<CheckBox aria-describedby={`${dryRunId}-hint`} ref={ref} id={dryRunId} checked={value} onChange={onChange} />
									)}
								/>
								<FieldLabel htmlFor={dryRunId}>{t('Dry_run')}</FieldLabel>
							</FieldRow>
							<FieldHint id={`${dryRunId}-hint`}>{t('Dry_run_description')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={queryId}>{t('Query')}</FieldLabel>
							<FieldRow>
								<TextInput
									id={queryId}
									{...register('query', {
										validate: (query) => (query && query !== '' && !isJSON(query) ? t('Query_is_not_valid_JSON') : true),
									})}
									error={errors.query?.message}
									aria-describedby={`${queryId}-error ${queryId}-hint`}
									aria-invalid={errors.query ? 'true' : 'false'}
								/>
							</FieldRow>
							{errors.query && (
								<FieldError id={`${queryId}-error`} aria-live='assertive'>
									{errors.query.message}
								</FieldError>
							)}
							<FieldHint id={`${queryId}-hint`}>{t('Query_description')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel required htmlFor={subjectId}>
								{t('Subject')}
							</FieldLabel>
							<FieldRow>
								<TextInput
									id={subjectId}
									{...register('subject', { required: t('error-the-field-is-required', { field: t('Subject') }) })}
									aria-describedby={`${subjectId}-error`}
									error={errors.subject?.message}
									aria-required='true'
									aria-invalid={errors.subject ? 'true' : 'false'}
								/>
							</FieldRow>
							{errors.subject && (
								<FieldError aria-live='assertive' id={`${subjectId}-error`}>
									{errors.subject.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel required htmlFor={emailBodyId}>
								{t('Email_body')}
							</FieldLabel>
							<FieldRow>
								<TextAreaInput
									id={emailBodyId}
									{...register('emailBody', {
										required: t('error-the-field-is-required', { field: t('Email_body') }),
										validate: (emailBody) => (emailBody?.indexOf('[unsubscribe]') === -1 ? t('error-missing-unsubscribe-link') : true),
									})}
									rows={10}
									aria-describedby={`${emailBodyId}-error ${emailBodyId}-hint`}
									error={errors.emailBody?.message}
									aria-required='true'
									aria-invalid={errors.emailBody ? 'true' : 'false'}
								/>
							</FieldRow>
							{errors.emailBody && (
								<FieldError aria-live='assertive' id={`${emailBodyId}-error`}>
									{errors.emailBody.message}
								</FieldError>
							)}
							<FieldHint id={`${emailBodyId}-hint`} dangerouslySetInnerHTML={{ __html: t('Mailer_body_tags') }} />
						</Field>
					</FieldGroup>
				</Box>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset(initialData)}>{t('Cancel')}</Button>
					<Button form={mailerFormId} primary type='submit'>
						{t('Send_email')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default MailerPage;
