import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContentBody from '../../MessageContentBody';
import { useMessageContent } from '../../contexts/MessageContentContext';

export type ThreadMessageContentProps = {
	message: IThreadMessage | IThreadMainMessage;
};

const ThreadMessageContent = ({ message }: ThreadMessageContentProps) => {
	const { t } = useTranslation();
	const encrypted = isE2EEMessage(message);
	const normalizedMessage = useMessageContent().useNormalizedMessage(message);

	return (
		<>
			{encrypted && normalizedMessage.e2e === 'pending' && (
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
				/>
			)}
		</>
	);
};

export default memo(ThreadMessageContent);
