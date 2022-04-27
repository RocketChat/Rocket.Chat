import { formatDistance } from 'date-fns';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import { withTranslation } from 'react-i18next';

import { getAttachmentUrl, memo, normalizeTransferHistoryMessage, resolveDate } from '../../helpers';
import { default as AudioAttachment } from '../AudioAttachment';
import { FileAttachment } from '../FileAttachment';
import { ImageAttachment } from '../ImageAttachment';
import { MessageAvatars } from '../MessageAvatars';
import MessageBlocks from '../MessageBlocks';
import { MessageBubble } from '../MessageBubble';
import { MessageContainer } from '../MessageContainer';
import { MessageContent } from '../MessageContent';
import { MessageText } from '../MessageText';
import MessageTime from '../MessageTime';
import VideoAttachment from '../VideoAttachment';
import {
	MESSAGE_TYPE_ROOM_NAME_CHANGED,
	MESSAGE_TYPE_USER_ADDED,
	MESSAGE_TYPE_USER_REMOVED,
	MESSAGE_TYPE_USER_JOINED,
	MESSAGE_TYPE_USER_LEFT,
	MESSAGE_TYPE_WELCOME,
	MESSAGE_TYPE_LIVECHAT_CLOSED,
	MESSAGE_TYPE_LIVECHAT_STARTED,
	MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
	MESSAGE_WEBRTC_CALL,
} from '../constants';

const renderContent = ({
	text,
	system,
	quoted,
	me,
	blocks,
	attachments,
	attachmentResolver,
	mid,
	rid,
}) => [
	...(attachments || [])
		.map((attachment) =>
			(attachment.audio_url
				&& <AudioAttachment
					quoted={quoted}
					url={attachmentResolver(attachment.audio_url)}
				/>)
			|| (attachment.video_url
				&& <VideoAttachment
					quoted={quoted}
					url={attachmentResolver(attachment.video_url)}
				/>)
			|| (attachment.image_url
				&& <ImageAttachment
					quoted={quoted}
					url={attachmentResolver(attachment.image_url)}
				/>)
			|| (attachment.title_link
				&& <FileAttachment
					quoted={quoted}
					url={attachmentResolver(attachment.title_link)}
					title={attachment.title}
				/>)
			|| ((attachment.message_link || attachment.tmid) && renderContent({
				text: attachment.text,
				quoted: true,
				attachments: attachment.attachments,
				attachmentResolver,
			})),
		),
	text && (
		<MessageBubble inverse={me} quoted={quoted} system={system}>
			<MessageText text={text} system={system} />
		</MessageBubble>
	),
	blocks && (
		<MessageBlocks
			blocks={blocks}
			mid={mid}
			rid={rid}
		/>
	),
].filter(Boolean);

const resolveWebRTCEndCallMessage = ({ webRtcCallEndTs, ts, t }) => {
	const callEndTime = resolveDate(webRtcCallEndTs);
	const callStartTime = resolveDate(ts);
	const callDuration = formatDistance(callEndTime, callStartTime);
	const time = format(callEndTime, isToday(callEndTime) ? 'HH:mm' : 'dddd HH:mm');
	return t('call_end_time', { time, callDuration });
};

const getSystemMessageText = ({ type, conversationFinishedMessage, transferData, u, webRtcCallEndTs, ts }, t) => (type === MESSAGE_TYPE_ROOM_NAME_CHANGED && t('room_name_changed'))
	|| (type === MESSAGE_TYPE_USER_ADDED && t('user_added_by'))
	|| (type === MESSAGE_TYPE_USER_REMOVED && t('user_removed_by'))
	|| (type === MESSAGE_TYPE_USER_JOINED && t('user_joined'))
	|| (type === MESSAGE_TYPE_USER_LEFT && t('user_left'))
	|| (type === MESSAGE_TYPE_WELCOME && t('welcome'))
	|| (type === MESSAGE_TYPE_LIVECHAT_CLOSED && (conversationFinishedMessage || t('conversation_finished')))
	|| (type === MESSAGE_TYPE_LIVECHAT_STARTED && t('chat_started'))
	|| (type === MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY && normalizeTransferHistoryMessage(transferData, u, t))
	|| (type === MESSAGE_WEBRTC_CALL && webRtcCallEndTs && ts && resolveWebRTCEndCallMessage({ webRtcCallEndTs, ts, t }));

const getMessageUsernames = (compact, message) => {
	if (compact || !message.u) {
		return [];
	}

	const { alias, u: { username, name } } = message;
	if (alias && name) {
		return [name];
	}

	return [username];
};

const Message = memo(({
	avatarResolver,
	attachmentResolver = getAttachmentUrl,
	use,
	me,
	compact,
	className,
	style = {},
	t,
	...message
}) => (
	<MessageContainer
		id={message._id}
		compact={compact}
		reverse={me}
		use={use}
		className={className}
		style={style}
		system={!!message.type}
	>
		{!message.type && <MessageAvatars
			avatarResolver={avatarResolver}
			usernames={getMessageUsernames(compact, message)}
		/>}
		<MessageContent reverse={me}>
			{renderContent({
				text: message.type ? getSystemMessageText(message, t) : message.msg,
				system: !!message.type,
				me,
				attachments: message.attachments,
				blocks: message.blocks,
				mid: message._id,
				rid: message.rid,
				attachmentResolver,
			})}
		</MessageContent>

		{!compact && !message.type && <MessageTime normal={!me} inverse={me} ts={message.ts} />}

	</MessageContainer>
));

export default withTranslation()(Message);
