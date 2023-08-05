import type { IMessage, IModerationReport } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Message, MessageName, MessageToolboxItem, MessageToolboxWrapper, MessageUsername } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitMessageBlock from '../../../../components/message/uikit/UiKitMessageBlock';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { useUserDisplayName } from '../../../../hooks/useUserDisplayName';
import MessageReportInfo from '../MessageReportInfo';
import useDeleteMessage from '../hooks/useDeleteMessage';
import { useDismissMessageAction } from '../hooks/useDismissMessageAction';
import ReportReasonCollapsible from './ReportReasonCollapsible';

const ContextMessage = ({
	message,
	room,
	deleted,
	onRedirect,
	onChange,
}: {
	message: any;
	room: IModerationReport['room'];
	deleted: boolean;
	onRedirect: (id: IMessage['_id']) => void;
	onChange: () => void;
}): JSX.Element => {
	const t = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

	const deleteMessage = useDeleteMessage(message._id, message.rid, onChange);
	const dismissMsgReport = useDismissMessageAction(message._id);

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));

	const name = message.u.name || '';
	const username = message.u.username || '';

	const displayName = useUserDisplayName({ name, username });

	return (
		<>
			<Message.Divider>{formatDate(message._updatedAt)}</Message.Divider>
			<Message>
				<Message.LeftContainer>
					<UserAvatar username={message.u.username} />
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<MessageName>{displayName}</MessageName>
						<>{useRealName && <MessageUsername>&nbsp;{`@${message.u.username}`}</MessageUsername>}</>
						<Message.Timestamp title={formatDateAndTime(message._updatedAt)}>
							{formatTime(message._updatedAt !== message.ts ? message._updatedAt : message.ts)}
							{message._updatedAt !== message.ts && ` (${t('edited')})`}
						</Message.Timestamp>
						<Message.Role>{room.name || room.fname || 'DM'}</Message.Role>
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
						{message.blocks && <UiKitMessageBlock mid={message._id} blocks={message.blocks} appId rid={message.rid} />}
						{message.attachments && <Attachments attachments={message.attachments} />}
					</Message.Body>
					<ReportReasonCollapsible>
						<MessageReportInfo msgId={message._id} />
					</ReportReasonCollapsible>
				</Message.Container>
				<MessageToolboxWrapper>
					<Message.Toolbox>
						<MessageToolboxItem
							icon='checkmark-circled'
							title={t('Moderation_Dismiss_reports')}
							onClick={() => dismissMsgReport.action()}
						/>
						<MessageToolboxItem icon='arrow-forward' title={t('Moderation_Go_to_message')} onClick={() => onRedirect(message._id)} />
						<MessageToolboxItem disabled={deleted} icon='trash' title={t('Moderation_Delete_message')} onClick={() => deleteMessage()} />
					</Message.Toolbox>
				</MessageToolboxWrapper>
			</Message>
		</>
	);
};

export default ContextMessage;
