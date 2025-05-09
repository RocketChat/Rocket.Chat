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
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';

import { useSendInvitationEmailMutation } from './hooks/useSendInvitationEmailMutation';
import { useSmtpQuery } from './hooks/useSmtpQuery';
import { validateEmail } from '../../../../lib/emailValidator';
import { ContextualbarScrollableContent, ContextualbarFooter, ContextualbarContent } from '../../../components/Contextualbar';
import { FormSkeleton } from '../../../components/Skeleton';

// TODO: Replace using RHF
const AdminInviteUsers = () => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const getEmails = useCallback((text: string) => text.split(/[\ ,;]+/i).filter((val: string) => validateEmail(val)), []);
	const adminRouter = useRoute('admin-settings');
	const sendInvitationMutation = useSendInvitationEmailMutation();
	const { data, isLoading } = useSmtpQuery();

	const handleClick = () => {
		sendInvitationMutation.mutate({ emails: getEmails(text) });
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
				<TextAreaInput rows={5} flexGrow={0} onChange={(e: ChangeEvent<HTMLInputElement>): void => setText(e.currentTarget.value)} />
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button icon='send' primary onClick={handleClick} disabled={!getEmails(text).length} alignItems='stretch' mb={8}>
						{t('Send')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminInviteUsers;
