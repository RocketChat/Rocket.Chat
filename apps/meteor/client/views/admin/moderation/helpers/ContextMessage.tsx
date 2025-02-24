import type { IMessage, MessageReport, MessageAttachment } from '@rocket.chat/core-typings';
import { isE2EEMessage, isQuoteAttachment } from '@rocket.chat/core-typings';
import { Message, MessageName, MessageToolbarItem, MessageToolbarWrapper, MessageUsername } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ReportReasonCollapsible from './ReportReasonCollapsible';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitMessageBlock from '../../../../components/message/uikit/UiKitMessageBlock';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import MessageReportInfo from '../MessageReportInfo';
import useDeleteMessage from '../hooks/useDeleteMessage';
import { useDismissMessageAction } from '../hooks/useDismissMessageAction';

const ContextMessage = ({
	message,
	room,
	deleted,
	onRedirect,
	onChange,
}: {
	message: any;
	room: MessageReport['room'];
	deleted: boolean;
	onRedirect: (id: IMessage['_id']) => void;
	onChange: () => void;
}): JSX.Element => {
	const { t } = useTranslation();

	const isEncryptedMessage = isE2EEMessage(message);

	const deleteMessage = useDeleteMessage(message._id, message.rid, onChange);
	const dismissMsgReport = useDismissMessageAction(message._id);

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();
	const useRealName = useSetting('UI_Use_Real_Name', false);

	const name = message.u.name || '';
	const username = message.u.username || '';

	const displayName = useUserDisplayName({ name, username });

	const quotes = message?.attachments?.filter(isQuoteAttachment) || [];

	const attachments = message?.attachments?.filter((attachment: MessageAttachment) => !isQuoteAttachment(attachment)) || [];

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
						{!!quotes?.length && <Attachments attachments={quotes} />}
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

						{!!attachments && <Attachments id={message.files?.[0]?._id} attachments={attachments} />}
						{message.blocks && <UiKitMessageBlock rid={message.rid} mid={message._id} blocks={message.blocks} />}
					</Message.Body>
					<ReportReasonCollapsible>
						<MessageReportInfo msgId={message._id} />
					</ReportReasonCollapsible>
				</Message.Container>
				<MessageToolbarWrapper>
					<Message.Toolbar>
						<MessageToolbarItem
							icon='checkmark-circled'
							title={t('Moderation_Dismiss_reports')}
							onClick={() => dismissMsgReport.action()}
						/>
						<MessageToolbarItem icon='arrow-forward' title={t('Moderation_Go_to_message')} onClick={() => onRedirect(message._id)} />
						<MessageToolbarItem disabled={deleted} icon='trash' title={t('Moderation_Delete_message')} onClick={() => deleteMessage()} />
					</Message.Toolbar>
				</MessageToolbarWrapper>
			</Message>
		</>
	);
};

export default ContextMessage;
