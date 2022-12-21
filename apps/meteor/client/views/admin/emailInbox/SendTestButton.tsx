import type { IEmailInboxPayload } from '@rocket.chat/core-typings';
import { Box, Button, TableCell, Icon } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const SendTestButton = ({ id }: { id: IEmailInboxPayload['_id'] }): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const sendTest = useEndpoint('POST', `/v1/email-inbox.send-test/${id}`);

	const handleOnClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>): Promise<void> => {
		e.preventDefault();
		e.stopPropagation();

		try {
			await sendTest();
			dispatchToastMessage({
				type: 'success',
				message: t('Email_sent'),
			});
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	};

	return (
		<TableCell withTruncatedText>
			<Button small onClick={handleOnClick}>
				<Box display='flex' alignItems='center'>
					<Icon mie='x4' size='x16' name='send' />
					{t('Send_Test_Email')}
				</Box>
			</Button>
		</TableCell>
	);
};

export default SendTestButton;
