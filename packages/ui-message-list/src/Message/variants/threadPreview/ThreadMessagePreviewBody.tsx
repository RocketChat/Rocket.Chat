import type { IMessage } from '@rocket.chat/core-typings';
import { isQuoteAttachment, isE2EEMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageRenderers } from '../../contexts/MessageRenderersContext';
import { toPlainTextRoot } from '../../lib/toPlainTextRoot';

export type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const getMdTokens = (message: IMessage): Root | undefined => {
	if (message.md) {
		return [...message.md];
	}

	if (message.msg) {
		return toPlainTextRoot(message.msg);
	}

	return undefined;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps) => {
	const { t } = useTranslation();
	const { PreviewMarkup } = useMessageRenderers();
	const isEncryptedMessage = isE2EEMessage(message);

	const mdTokens = getMdTokens(message);
	if (
		message.attachments &&
		Array.isArray(message.attachments) &&
		message.attachments.length > 0 &&
		isQuoteAttachment(message.attachments[0])
	) {
		mdTokens?.shift();
	}

	if (message.attachments && message.msg === '') {
		return <>{t('Message_with_attachment')}</>;
	}

	if (!isEncryptedMessage || message.e2e === 'done') {
		return mdTokens?.length ? <PreviewMarkup message={{ ...message, md: mdTokens }} /> : <>{message.msg}</>;
	}

	if (message.e2e === 'pending') {
		return <>{t('E2E_message_encrypted_placeholder')}</>;
	}

	return <>{message.msg}</>;
};

export default memo(ThreadMessagePreviewBody);
