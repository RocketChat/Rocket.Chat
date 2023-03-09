import type { IMessage, IReport } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Message, MessageToolboxItem, MessageToolboxWrapper } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitSurface from '../../../../components/message/content/UiKitSurface';
import { formatDate } from '../../../../lib/utils/formatDate';
import { formatDateAndTime } from '../../../../lib/utils/formatDateAndTime';
import { formatTime } from '../../../../lib/utils/formatTime';

const ContextMessage = ({
	message,
	room,
	handleClick,
	onRedirect,
}: {
	message: IReport['message'];
	room: IReport['room'];
	handleClick: (id: IMessage['_id']) => void;
	onRedirect: (id: IMessage['_id']) => void;
}): JSX.Element => {
	const t = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

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
						<Message.Timestamp title={formatDateAndTime(message._updatedAt)}>
							{formatTime(message._updatedAt !== message.ts ? message._updatedAt : message.ts)}
							{message._updatedAt !== message.ts && ` (${t('edited')})`}
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
				<MessageToolboxWrapper>
					<Message.Toolbox>
						<MessageToolboxItem icon='document-eye' title='View Reports' onClick={() => handleClick(message._id)} />
						<MessageToolboxItem icon='arrow-forward' title='Go to Message' onClick={() => onRedirect(message._id)} />
					</Message.Toolbox>
				</MessageToolboxWrapper>
			</Message>
		</>
	);
};

export default ContextMessage;
