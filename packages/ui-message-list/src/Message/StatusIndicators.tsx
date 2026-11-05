import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isE2EEMessage, isE2EEPinnedMessage } from '@rocket.chat/core-typings';
import { MessageStatusIndicator, MessageStatusIndicatorItem } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useMessageDisplay } from './contexts/MessageDisplayContext';

export type StatusIndicatorsProps = {
	message: IMessage & Partial<ITranslatedMessage>;
};

const StatusIndicators = ({ message }: StatusIndicatorsProps) => {
	const { t } = useTranslation();
	const { isTranslated, isStarred, isFollowing, formatDateAndTime } = useMessageDisplay();
	const uid = useUserId();

	const isEncryptedMessage = isE2EEMessage(message) || isE2EEPinnedMessage(message);

	return (
		<MessageStatusIndicator>
			{isTranslated(message) && <MessageStatusIndicatorItem name='language' title={t('Translated')} />}

			{isFollowing(message) && <MessageStatusIndicatorItem name='bell' title={t('Following')} />}

			{message.sentByEmail && <MessageStatusIndicatorItem name='mail' title={t('Message_sent_by_email')} />}
			{isEditedMessage(message) && (
				<MessageStatusIndicatorItem
					name='edit'
					color={message.u._id !== message.editedBy._id ? 'danger' : undefined}
					title={
						message.editedBy._id === uid
							? t('Message_has_been_edited_at', { date: formatDateAndTime(message.editedAt) })
							: t('Message_has_been_edited_by_at', {
									username: message.editedBy.username || '?',
									date: formatDateAndTime(message.editedAt),
								})
					}
				/>
			)}
			{message.pinned && <MessageStatusIndicatorItem name='pin' title={t('Message_has_been_pinned')} />}

			{isEncryptedMessage && <MessageStatusIndicatorItem name='key' />}

			{isStarred(message) && <MessageStatusIndicatorItem name='star-filled' title={t('Message_has_been_starred')} />}
		</MessageStatusIndicator>
	);
};

export default StatusIndicators;
