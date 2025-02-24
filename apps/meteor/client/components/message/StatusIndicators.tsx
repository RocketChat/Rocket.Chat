import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isE2EEMessage, isOTRMessage, isOTRAckMessage, isE2EEPinnedMessage } from '@rocket.chat/core-typings';
import { MessageStatusIndicator, MessageStatusIndicatorItem } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageDateFormatter, useShowStarred, useShowTranslated, useShowFollowing } from './list/MessageListContext';

type StatusIndicatorsProps = {
	message: IMessage & Partial<ITranslatedMessage>;
};

const StatusIndicators = ({ message }: StatusIndicatorsProps): ReactElement => {
	const { t } = useTranslation();
	const translated = useShowTranslated(message);
	const starred = useShowStarred({ message });
	const following = useShowFollowing({ message });

	const isEncryptedMessage = isE2EEMessage(message) || isE2EEPinnedMessage(message);
	const isOtrMessage = isOTRMessage(message) || isOTRAckMessage(message);

	const uid = useUserId();

	const formatter = useMessageDateFormatter();

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
							? t('Message_has_been_edited_at', { date: formatter(message.editedAt) })
							: t('Message_has_been_edited_by_at', {
									username: message.editedBy.username || '?',
									date: formatter(message.editedAt),
								})
					}
				/>
			)}
			{message.pinned && <MessageStatusIndicatorItem name='pin' title={t('Message_has_been_pinned')} />}

			{isEncryptedMessage && <MessageStatusIndicatorItem name='key' />}

			{isOtrMessage && <MessageStatusIndicatorItem name='stopwatch' />}

			{starred && <MessageStatusIndicatorItem name='star-filled' title={t('Message_has_been_starred')} />}
		</MessageStatusIndicator>
	);
};

export default StatusIndicators;
