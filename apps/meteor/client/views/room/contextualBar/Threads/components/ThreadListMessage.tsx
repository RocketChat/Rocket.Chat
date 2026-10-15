import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Message,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageStatusIndicatorItem,
	Box,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadListMetrics from './ThreadListMetrics';
import Emoji from '../../../../../components/Emoji';
import ThreadMetricsFollow from '../../../../../components/message/content/ThreadMetricsFollow';
import { useThreadListTimeAgo } from '../hooks/useThreadListTimeAgo';

// MessageBody clamps to two lines at the least.
const singleLineStyle = css`
	display: -webkit-box;
	overflow: hidden;
	word-break: break-word;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 1;
`;

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
} & Omit<ComponentProps<typeof Box>, 'is'>;

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
	className = [],
	emoji,
	hasDraft,
	...props
}: ThreadListMessageProps) => {
	const { t } = useTranslation();
	const formatDate = useThreadListTimeAgo();

	return (
		<Box className={className}>
			<Box paddingBlock={12} paddingInlineStart={12} paddingInlineEnd={8} is={Message} {...props}>
				<MessageContainer>
					<MessageHeader>
						<Box flexShrink={0} marginInlineEnd={6}>
							<MessageAvatar emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined} username={username} size='x20' />
						</Box>
						<MessageName title={username}>{name}</MessageName>
						{hasDraft && <MessageStatusIndicatorItem name='pencil' title={t('Unfinished_thread_message')} />}
						<Box flexGrow={1} />
						<MessageTimestamp>{formatDate(ts)}</MessageTimestamp>
						{/* Cancels the metrics item's own end margin, so the bell sits as close to the edge as the avatar does on the other side. */}
						<Box flexShrink={0} marginInlineStart={4} marginInlineEnd={-4}>
							<ThreadMetricsFollow following={following} mid={_id} rid={rid} unread={unread} mention={mention} all={all} />
						</Box>
					</MessageHeader>
					<MessageBody>
						<Box className={singleLineStyle}>{msg}</Box>
					</MessageBody>
					<ThreadListMetrics lm={tlm} participants={participants || []} counter={replies} />
				</MessageContainer>
			</Box>
		</Box>
	);
};

export default memo(ThreadListMessage);
