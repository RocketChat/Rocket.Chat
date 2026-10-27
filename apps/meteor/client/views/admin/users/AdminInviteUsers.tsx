import {
	Button,
	ButtonGroup,
	Field,
	FieldError,
	FieldHint,
	FieldLabel,
	FieldRow,
	States,
	StatesAction,
	StatesActions,
	StatesSubtitle,
	Stack,
	StatesTitle,
	Text,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { validateEmail } from '@rocket.chat/tools';
import { ContextualbarScrollableContent, ContextualbarFooter, ContextualbarContent } from '@rocket.chat/ui-client';
import { useRoute } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSendInvitationEmailMutation } from './hooks/useSendInvitationEmailMutation';
import { useSmtpQuery } from './hooks/useSmtpQuery';
import { FormSkeleton } from '../../../components/Skeleton';

type AdminInviteUsersFormValues = {
	emails: string;
};

const getEmails = (text: string) => text.split(/[ ,;]+/i).filter((val: string) => validateEmail(val));

const AdminInviteUsers = () => {
	const { t } = useTranslation();
	const formId = useId();
	const emailsFieldId = useId();
	const adminRouter = useRoute('admin-settings');
	const sendInvitationMutation = useSendInvitationEmailMutation();
	const { data, isLoading } = useSmtpQuery();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<AdminInviteUsersFormValues>({ defaultValues: { emails: '' } });

	const handleSend = ({ emails }: AdminInviteUsersFormValues) => {
		sendInvitationMutation.mutate({ emails: getEmails(emails) });
	};

	if (isLoading) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	if (!data?.isSMTPConfigured) {
		return (
			<ContextualbarScrollableContent>
				<States>
					<StatesTitle>{t('SMTP_Server_Not_Setup_Title')}</StatesTitle>
					<StatesSubtitle>{t('SMTP_Server_Not_Setup_Description')}</StatesSubtitle>
					<StatesActions>
						<StatesAction role='link' onClick={() => adminRouter.push({ group: 'Email' })}>
							{t('Setup_SMTP')}
						</StatesAction>
					</StatesActions>
				</States>
			</ContextualbarScrollableContent>
		);
	}

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSend)} id={formId}>
				<Field>
					<Stack gap={8}>
						<FieldLabel htmlFor={emailsFieldId}>
							<Text is='span' fontScale='h2'>
								{t('Send_invitation_email')}
							</Text>
						</FieldLabel>
						<FieldHint id={`${emailsFieldId}-hint`}>
							<Text is='span' fontScale='p2'>
								{t('Send_invitation_email_info')}
							</Text>
						</FieldHint>
					</Stack>
					<FieldRow>
						<Controller
							control={control}
							name='emails'
							rules={{ validate: (value) => getEmails(value).length > 0 || t('Send_invitation_email_error') }}
							render={({ field }) => (
								<TextAreaInput
									{...field}
									id={emailsFieldId}
									rows={5}
									placeholder={t('Send_invitation_email_placeholder')}
									error={errors.emails?.message}
									aria-invalid={errors.emails ? 'true' : 'false'}
									aria-describedby={`${emailsFieldId}-hint ${emailsFieldId}-error`}
								/>
							)}
						/>
					</FieldRow>
					{errors.emails && (
						<FieldError role='alert' id={`${emailsFieldId}-error`}>
							{errors.emails.message}
						</FieldError>
					)}
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button icon='send' variant='primary' type='submit' form={formId} loading={sendInvitationMutation.isPending}>
						{t('Send')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminInviteUsers;
