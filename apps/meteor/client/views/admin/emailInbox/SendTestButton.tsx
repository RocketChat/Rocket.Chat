import { Button, Icon, TableCell } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type SendTestButtonProps = {
	id: string;
};

const SendTestButton = ({ id }: SendTestButtonProps): ReactElement => {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const sendTest = useEndpoint('POST', `email-inbox.send-test/${id}`);

	const handleOnClick = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
		e.preventDefault();
		e.stopPropagation();
		sendTest();
		dispatchToastMessage({
			type: 'success',
			message: t('Email_sent'),
		});
	};

	return (
		<TableCell fontScale='p2' color='hint' withTruncatedText>
			<Button small ghost title={t('Send_Test_Email')} onClick={handleOnClick}>
				<Icon name='send' size='x20' />
			</Button>
		</TableCell>
	);
};

export default SendTestButton;
