import type { IReport } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Message } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitSurface from '../../../../components/message/content/UiKitSurface';
import { formatDate } from '../../../../lib/utils/formatDate';
import { formatTime } from '../../../../lib/utils/formatTime';
import { useTranslateAttachments } from '../../../room/MessageList/contexts/MessageListContext';

const ContextMessage = ({ message, room }: { message: IReport['message']; room: IReport['room'] }): JSX.Element => {
	const t = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

	const messageAttachments = useTranslateAttachments({ message });

	console.log('attachments', messageAttachments);

	return (
		<>
			<Message.Divider>{formatDate(message._updatedAt)}</Message.Divider>
			<Message>
				<Message.LeftContainer>
					<UserAvatar username={message.u.username} />
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Username>{message.u.username}</Message.Username>
						<Message.Timestamp>
							{formatTime(message.ts)}
							{message._updatedAt && ` (${t('edited')})`}
						</Message.Timestamp>
						<Message.Role>{room.name || room.fname}</Message.Role>
					</Message.Header>
					<Message.Body>
						{!message.blocks?.length && !!message.md?.length ? (
							<>
								{(!isEncryptedMessage || message.e2e === 'done') && (
									<MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />
								)}
								{message.e2e === 'pending' && t('E2E_message_encrypted_placeholder')}
							</>
						) : (
							message.msg
						)}
						{message.blocks && <UiKitSurface mid={message._id} blocks={message.blocks} appId rid={message.rid} />}
						{message.attachments && <Attachments attachments={message.attachments} file={message.file} />}
					</Message.Body>
				</Message.Container>
			</Message>
		</>
	);
};

export default ContextMessage;
