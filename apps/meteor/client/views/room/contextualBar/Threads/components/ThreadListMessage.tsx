import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageLeftContainer,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageContainerFixed,
	MessageStatusIndicatorItem,
	Message,
	Box,
	Stack,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadListMetrics from './ThreadListMetrics';
import Emoji from '../../../../../components/Emoji';
import ThreadMetricsFollow from '../../../../../components/message/content/ThreadMetricsFollow';
import ThreadMetricsUnreadBadge from '../../../../../components/message/content/ThreadMetricsUnreadBadge';
import { activateWithKeyboard } from '../../../../../lib/clickableItem';

export type ThreadListMessageProps = {
	_id: IMessage['_id'];
	msg: ReactNode;
	following: boolean;
	username: IMessage['u']['username'];
	name?: IMessage['u']['name'];
	ts: IMessage['ts'];
	replies: number;
	participants: string[] | undefined;
	rid: IMessage['rid'];
	unread: boolean;
	mention: boolean;
	all: boolean;
	tlm: Date;
	emoji: IMessage['emoji'];
	hasDraft?: boolean;
	ignored?: boolean;
} & ComponentProps<typeof Message>;

const ThreadListMessage = ({
	_id,
	msg,
	following,
	username,
	name = username,
	ts,
	replies,
	participants,
	unread,
	rid,
	mention,
	all,
	tlm,
	emoji,
	hasDraft,
	ignored,
	...props
}: ThreadListMessageProps) => {
	const { t } = useTranslation();
	const formatDate = useTimeAgo();

	return (
		<Message clickable insetBlock='md' tabIndex={0} onKeyDown={activateWithKeyboard} {...props}>
			<MessageLeftContainer>
				<MessageAvatar emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined} username={username} size='x36' />
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageName title={username}>{name}</MessageName>
					<MessageTimestamp>{formatDate(ts)}</MessageTimestamp>
					{hasDraft && <MessageStatusIndicatorItem name='pencil' title={t('Thread_draft')} />}
				</MessageHeader>
				<MessageBody clamp={2}>
					{ignored ? (
						<Box is='span' fontSize='c2' color='hint'>
							{t('Message_Ignored')}
						</Box>
					) : (
						msg
					)}
				</MessageBody>
				<ThreadListMetrics lm={tlm} participants={participants || []} counter={replies} />
			</MessageContainer>
			<MessageContainerFixed>
				<Stack align='center' gap='x24'>
					<ThreadMetricsFollow following={following} mid={_id} rid={rid} mention={false} unread={false} all={false} />
					{unread && <ThreadMetricsUnreadBadge unread={unread} mention={mention} all={all} />}
				</Stack>
			</MessageContainerFixed>
		</Message>
	);
};

export default memo(ThreadListMessage);
