import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isE2EEMessage, isE2EEPinnedMessage } from '@rocket.chat/core-typings';
import { MessageStatusIndicator, MessageStatusIndicatorItem } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { isMessageFollowedBy, isMessageStarredBy } from './helpers/messageViewerFacts';
import { useMessageListSubscribed, useShowTranslated } from './list/MessageListContext';
import { useMessageListViewer } from './list/MessageViewerContext';

export type StatusIndicatorsProps = {
	message: IMessage & Partial<ITranslatedMessage>;
};

const StatusIndicators = ({ message }: StatusIndicatorsProps) => {
	const { t } = useTranslation();
	const translated = useShowTranslated(message);

	const isEncryptedMessage = isE2EEMessage(message) || isE2EEPinnedMessage(message);

	const { uid } = useMessageListViewer();
	const starred = useMessageListSubscribed() && isMessageStarredBy(message, uid);
	const following = isMessageFollowedBy(message, uid);

	return (
		<MessageStatusIndicator>
			{translated && <MessageStatusIndicatorItem name='language' title={t('Translated')} />}

			{following && <MessageStatusIndicatorItem name='bell' title={t('Following')} />}

			{message.sentByEmail && <MessageStatusIndicatorItem name='mail' title={t('Message_sent_by_email')} />}
			{isEditedMessage(message) && (
				<MessageStatusIndicatorItem
					name='edit'
					color={message.u._id !== message.editedBy._id ? 'danger' : undefined}
					title={
						message.editedBy._id === uid
							? t('Message_has_been_edited_at', { date: message.editedAt.toLocaleString() })
							: t('Message_has_been_edited_by_at', {
									username: message.editedBy.username || '?',
									date: message.editedAt.toLocaleString(),
								})
					}
				/>
			)}
			{message.pinned && <MessageStatusIndicatorItem name='pin' title={t('Message_has_been_pinned')} />}

			{isEncryptedMessage && <MessageStatusIndicatorItem name='key' />}

			{starred && <MessageStatusIndicatorItem name='star-filled' title={t('Message_has_been_starred')} />}
		</MessageStatusIndicator>
	);
};

export default StatusIndicators;
