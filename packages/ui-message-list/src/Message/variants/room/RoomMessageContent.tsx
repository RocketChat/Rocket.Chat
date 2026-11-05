import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContentBody from '../../MessageContentBody';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import { useMessageContent } from '../../contexts/MessageContentContext';
import { useMessageDisplay } from '../../contexts/MessageDisplayContext';

export type RoomMessageContentProps = {
	message: IMessage;
	unread: boolean;
	mention: boolean;
	all: boolean;
	searchText?: string;
};

const RoomMessageContent = ({ message, searchText }: RoomMessageContentProps) => {
	const { t } = useTranslation();
	const encrypted = isE2EEMessage(message);
	const { readReceipts } = useMessageDisplay();
	const normalizedMessage = useMessageContent().useNormalizedMessage(message);
	const isMessageEncrypted = encrypted && normalizedMessage.e2e === 'pending';

	return (
		<>
			{isMessageEncrypted && (
				<MessageBody role='document' aria-roledescription={t('message_body')}>
					{t('E2E_message_encrypted_placeholder')}
				</MessageBody>
			)}

			{!normalizedMessage.blocks?.length && !!normalizedMessage.md.length && (!encrypted || normalizedMessage.e2e === 'done') && (
				<MessageContentBody
					id={`${normalizedMessage._id}-content`}
					md={normalizedMessage.md}
					msg={normalizedMessage.mdSource}
					mentions={normalizedMessage.mentions}
					channels={normalizedMessage.channels}
					searchText={searchText}
				/>
			)}

			{readReceipts.enabled && <ReadReceiptIndicator mid={normalizedMessage._id} unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
