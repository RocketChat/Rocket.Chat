import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { parseMessageTextToAstMarkdown } from '../../../../views/room/MessageList/lib/parseMessageTextToAstMarkdown';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const t = useTranslation();
	const isEncryptedMessage = isE2EEMessage(message);

	const parsedMessage = parseMessageTextToAstMarkdown(message, { colors: true, emoticons: true });

	const getMessage = () => {
		if (!isEncryptedMessage || message.e2e === 'done') {
			return parsedMessage.md ? <PreviewMarkup tokens={parsedMessage.md} /> : <>{parsedMessage.msg}</>;
		}

		if (isEncryptedMessage && message.e2e === 'pending') {
			return <>{t('E2E_message_encrypted_placeholder')}</>;
		}

		return <>{parsedMessage.msg}</>;
	};

	return getMessage();
};

export default ThreadMessagePreviewBody;
