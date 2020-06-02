import React, { useCallback, useState } from 'react';
import { Box, Button, Icon, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import VerticalBar from '../../components/basic/VerticalBar';

export function InviteUsers({ data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [text, setText] = useState('');
	const sendInvites = useMethod('sendInvitationEmail');
	const getEmails = useCallback((text) => text.split(/[\ ,;]+/i).filter((val) => isEmail(val)), []);
	const handleClick = () => {
		sendInvites(getEmails(text), (error, result) => {
			if (result) {
				return dispatchToastMessage({ type: 'success', message: t('Emails_sent_successfully!') });
			}
			if (error) {
				return dispatchToastMessage({ type: 'error', message: error });
			}
		});
	};
	return <VerticalBar.ScrollableContent {...props}>
		<Box is='h2' fontScale='h1' mb='x8'>{t('Send_invitation_email')}</Box>
		<Box fontScale='p1' mb='x8'>{t('Send_invitation_email_info')}</Box>
		<TextAreaInput rows={5} flexGrow={0} onChange={(e) => setText(e.currentTarget.value)}/>
		<Button primary onClick={handleClick} alignItems='stretch' mb='x8'>
			<Icon name='send' size='x16'/>
			{t('Send')}
		</Button>
	</VerticalBar.ScrollableContent>;
}
