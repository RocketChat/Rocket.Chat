import { IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage as ThreadMessageTemplate,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageBody,
	ThreadMessageUnfollow,
	CheckBox,
} from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { isE2EEMessage } from '../../../../../lib/isE2EEMessage';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage, useCountSelected } from '../contexts/SelectedMessagesContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';
import EncryptedMessageRender from './EncryptedMessageRender';

export const ThreadMessagePreview: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread, openRoom, openUserCard },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	const t = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	return (
		<ThreadMessageTemplate
			{...props}
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
		>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>{parentMessage.phase === AsyncStatePhase.RESOLVED ? body : <Skeleton />}</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow onClick={!message.ignored && !isSelecting ? openThread(message.tmid, message._id) : undefined}>
				<ThreadMessageLeftContainer>
					{!isSelecting && <UserAvatar username={message.u.username} size='x18' />}
					{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{message.ignored && t('Message_Ignored')}
						{!isEncryptedMessage && !message.blocks && message.md && !message.ignored && (
							<MessageBodyRender
								onUserMentionClick={openUserCard}
								onChannelMentionClick={openRoom}
								mentions={message?.mentions || []}
								channels={message?.channels || []}
								tokens={message.md}
								disableBigEmoji
							/>
						)}

						{!isEncryptedMessage && !message.blocks && !message.md && !message.ignored && message.msg}

						{isEncryptedMessage && !message.ignored && <EncryptedMessageRender message={message} />}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessageTemplate>
	);
};
