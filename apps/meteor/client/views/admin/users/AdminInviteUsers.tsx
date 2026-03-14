import {
	Box,
	Button,
	ButtonGroup,
	States,
	StatesAction,
	StatesActions,
	StatesSubtitle,
	StatesTitle,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { validateEmail } from '@rocket.chat/tools';
import { ContextualbarScrollableContent, ContextualbarFooter, ContextualbarContent } from '@rocket.chat/ui-client';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useSendInvitationEmailMutation } from './hooks/useSendInvitationEmailMutation';
import { useSmtpQuery } from './hooks/useSmtpQuery';
import { FormSkeleton } from '../../../components/Skeleton';

const AdminInviteUsers = () => {
	const t = useTranslation();
	const getEmails = useCallback((text: string) => text.split(/[\ ,;]+/i).filter((val: string) => validateEmail(val)), []);
	const adminRouter = useRoute('admin-settings');
	const sendInvitationMutation = useSendInvitationEmailMutation();
	const { data, isLoading } = useSmtpQuery();

	const { control, handleSubmit, formState: { isValid } } = useForm({
		defaultValues: { emails: '' },
		mode: 'onChange',
	});

	const onSubmit = ({ emails }: { emails: string }) => {
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
			<ContextualbarScrollableContent>
				<Box is='h2' fontScale='h2' mb={8}>
					{t('Send_invitation_email')}
				</Box>
				<Box fontScale='p2' mb={8}>
					{t('Send_invitation_email_info')}
				</Box>
				<Controller
					control={control}
					name='emails'
					rules={{ validate: (value) => getEmails(value).length > 0 || t('Send_invitation_email_info') }}
					render={({ field }) => <TextAreaInput {...field} rows={5} flexGrow={0} />}
				/>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button icon='send' primary onClick={handleSubmit(onSubmit)} disabled={!isValid} alignItems='stretch' mb={8}>
						{t('Send')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminInviteUsers;
