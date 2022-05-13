import { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import MessageRender from './MessageRender';

const EncryptedMessageRender = ({ message }: { message: IMessage }): ReactElement => {
	const t = useTranslation();
	if (message.e2e === 'pending') {
		return <>{t('E2E_message_encrypted_placeholder')}</>;
	}

	return <MessageRender message={message} />;
};

export default EncryptedMessageRender;
