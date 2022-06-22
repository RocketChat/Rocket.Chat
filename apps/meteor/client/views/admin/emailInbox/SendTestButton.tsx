import { IconButton, TableCell } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type SendTestButtonProps = {
	id: string;
};

const SendTestButton = ({ id }: SendTestButtonProps): ReactElement => {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const sendTest = useEndpoint('POST', `/v1/email-inbox.send-test/${id}`);

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
			<IconButton icon='send' small title={t('Send_Test_Email')} onClick={handleOnClick} />
		</TableCell>
	);
};

export default SendTestButton;
