import type { IMessage } from '@rocket.chat/core-typings';
import {
	Message,
	MessageLeftContainer,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageContainerFixed,
	Box,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { memo } from 'react';

import ThreadListMetrics from './ThreadListMetrics';
import Emoji from '../../../../../components/Emoji';
import ThreadMetricsFollow from '../../../../../components/message/content/ThreadMetricsFollow';
import ThreadMetricsUnreadBadge from '../../../../../components/message/content/ThreadMetricsUnreadBadge';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

type ThreadListMessageProps = {
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
	...props
}: ThreadListMessageProps): ReactElement => {
	const formatDate = useTimeAgo();

	return (
		<Box className={className}>
			<Box pbs={16} is={Message} {...props}>
				<MessageLeftContainer>
					<MessageAvatar emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined} username={username} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageName title={username}>{name}</MessageName>
						<MessageTimestamp>{formatDate(ts)}</MessageTimestamp>
					</MessageHeader>
					<MessageBody clamp={2}>{msg}</MessageBody>
					<ThreadListMetrics lm={tlm} participants={participants || []} counter={replies} />
				</MessageContainer>
				<MessageContainerFixed>
					<ThreadMetricsFollow following={following} mid={_id} rid={rid} mention={false} unread={false} all={false} />
					{unread && (
						<Box mbs={24}>
							<ThreadMetricsUnreadBadge unread={unread} mention={mention} all={all} />
						</Box>
					)}
				</MessageContainerFixed>
			</Box>
		</Box>
	);
};

export default memo(ThreadListMessage);
