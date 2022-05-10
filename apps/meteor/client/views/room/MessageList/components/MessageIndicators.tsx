import { IMessage, isEditedMessage } from '@rocket.chat/core-typings';
import { MessageStatusIndicator, MessageStatusIndicatorItem } from '@rocket.chat/fuselage';
import { useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { isE2EEMessage } from '../../../../../lib/isE2EEMessage';
import { useMessageDateFormatter, useShowStarred, useShowTranslated, useShowFollowing } from '../contexts/MessageListContext';

// edited() {
// 	const { msg } = this;
// 	return msg.editedAt && !MessageTypes.isSystemMessage(msg);
// },
// editTime() {
// 	const { msg } = this;
// 	return msg.editedAt ? formatDateAndTime(msg.editedAt) : '';
// },
// editedBy() {
// 	const { msg } = this;
// 	if (!msg.editedAt) {
// 		return '';
// 	}
// 	// try to return the username of the editor,
// 	// otherwise a special "?" character that will be
// 	// rendered as a special avatar
// 	return (msg.editedBy && msg.editedBy.username) || '?';
// },

export const MessageIndicators: FC<{
	message: IMessage;
}> = ({ message }) => {
	const t = useTranslation();
	const translated = useShowTranslated({ message }); // TODO: useMessageTranslated
	const starred = useShowStarred({ message }); // TODO: useMessageStarred
	const following = useShowFollowing({ message }); // TODO: useMessageFollowing

	const isEncryptedMessage = isE2EEMessage(message);
	const uid = useUserId();

	const formatter = useMessageDateFormatter(); // TODO: useMessageDateFormatter

	return (
		<MessageStatusIndicator>
			{translated && <MessageStatusIndicatorItem name='pin' data-title={t('Message_has_been_pinned')} />}

			{following && <MessageStatusIndicatorItem name='bell' data-title={t('Following')} />}

			{message.sentByEmail && <MessageStatusIndicatorItem name='mail' data-title={t('Message_sent_by_email')} />}
			{isEditedMessage(message) && (
				<MessageStatusIndicatorItem
					name='edit'
					color={message.u._id !== message.editedBy._id ? 'danger' : undefined}
					data-title={
						message.editedBy._id === uid
							? t('Message_has_been_edited_at', { date: formatter(message.editedAt) })
							: t('Message_has_been_edited_by_at', {
									username: message.editedBy.username || '?',
									date: formatter(message.editedAt),
							  })
					}
				/>
			)}
			{message.pinned && <MessageStatusIndicatorItem name='pin' data-title={t('Message_has_been_pinned')} />}

			{isEncryptedMessage && <MessageStatusIndicatorItem name='key' />}

			{starred && <MessageStatusIndicatorItem name='star-filled' data-title={t('Message_has_been_starred')} />}
		</MessageStatusIndicator>
	);
};
