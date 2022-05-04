import { Button, Table, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

function SendTestButton({ id }) {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const sendTest = useEndpoint('POST', `email-inbox.send-test/${id}`);

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Button
				small
				ghost
				title={t('Send_Test_Email')}
				onClick={(e) =>
					e.preventDefault() & e.stopPropagation() & sendTest() & dispatchToastMessage({ type: 'success', message: t('Email_sent') })
				}
			>
				<Icon name='send' size='x20' />
			</Button>
		</Table.Cell>
	);
}

export default SendTestButton;
