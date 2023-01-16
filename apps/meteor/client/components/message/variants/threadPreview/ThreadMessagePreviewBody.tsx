import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const t = useTranslation();
	const isEncryptedMessage = isE2EEMessage(message);

	const getMessage = () => {
		if (!isEncryptedMessage || message.e2e === 'done') {
			return message.md ? <PreviewMarkup tokens={message.md} /> : <>{message.msg}</>;
		}

		if (isEncryptedMessage && message.e2e === 'pending') {
			return <>{t('E2E_message_encrypted_placeholder')}</>;
		}

		return <>{message.msg}</>;
	};

	return getMessage();
};

export default ThreadMessagePreviewBody;
