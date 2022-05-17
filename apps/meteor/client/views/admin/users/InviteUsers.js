import { Box, Button, Icon, TextAreaInput } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';

import { validateEmail } from '../../../../lib/emailValidator';
import VerticalBar from '../../../components/VerticalBar';

export function InviteUsers({ data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [text, setText] = useState('');
	const sendInvites = useMethod('sendInvitationEmail');
	const getEmails = useCallback((text) => text.split(/[\ ,;]+/i).filter((val) => validateEmail(val)), []);
	const handleClick = async () => {
		try {
			await sendInvites(getEmails(text));
			dispatchToastMessage({ type: 'success', message: t('Emails_sent_successfully!') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error.message });
		}
	};
	return (
		<VerticalBar.ScrollableContent {...props}>
			<Box is='h2' fontScale='h2' mb='x8'>
				{t('Send_invitation_email')}
			</Box>
			<Box fontScale='p2' mb='x8'>
				{t('Send_invitation_email_info')}
			</Box>
			<TextAreaInput rows={5} flexGrow={0} onChange={(e) => setText(e.currentTarget.value)} />
			<Button primary onClick={handleClick} disabled={!getEmails(text).length} alignItems='stretch' mb='x8'>
				<Icon name='send' size='x16' />
				{t('Send')}
			</Button>
		</VerticalBar.ScrollableContent>
	);
}
