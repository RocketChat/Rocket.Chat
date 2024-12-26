import type { IEmailInboxPayload } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableCell } from '../../../components/GenericTable';

const SendTestButton = ({ id }: { id: IEmailInboxPayload['_id'] }): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const sendTest = useEndpoint('POST', '/v1/email-inbox.send-test/:_id', { _id: id });

	const handleOnClick = async (e: MouseEvent<HTMLElement>): Promise<void> => {
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
		<GenericTableCell withTruncatedText>
			<Button icon='send' small onClick={handleOnClick}>
				{t('Send_Test_Email')}
			</Button>
		</GenericTableCell>
	);
};

export default SendTestButton;
