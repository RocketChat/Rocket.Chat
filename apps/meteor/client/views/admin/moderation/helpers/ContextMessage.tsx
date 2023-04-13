import type { IMessage, IReport } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Message, MessageToolboxItem, MessageToolboxWrapper } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitSurface from '../../../../components/message/content/UiKitSurface';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import useDeleteMessage from '../hooks/useDeleteMessage';

const ContextMessage = ({
	message,
	room,
	handleClick,
	onRedirect,
	onChange,
	onReload,
}: {
	message: any;
	room: IReport['room'];
	handleClick: (id: IMessage['_id']) => void;
	onRedirect: (id: IMessage['_id']) => void;
	onChange: () => void;
	onReload: () => void;
}): JSX.Element => {
	const t = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

	const deleteMessage = useDeleteMessage(message._id, message.rid, onChange, onReload);

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();

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
						{message.attachments && <Attachments attachments={message.attachments} />}
					</Message.Body>
				</Message.Container>
				<MessageToolboxWrapper>
					<Message.Toolbox>
						<MessageToolboxItem icon='document-eye' title='View Reports' onClick={() => handleClick(message._id)} />
						<MessageToolboxItem icon='arrow-forward' title='Go to Message' onClick={() => onRedirect(message._id)} />
						<MessageToolboxItem icon='trash' title='Delete Message' onClick={() => deleteMessage()} />
					</Message.Toolbox>
				</MessageToolboxWrapper>
			</Message>
		</>
	);
};

export default ContextMessage;
