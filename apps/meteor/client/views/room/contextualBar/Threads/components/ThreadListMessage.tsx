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
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadListMetrics from './ThreadListMetrics';
import Emoji from '../../../../../components/Emoji';
import ThreadMetricsFollow from '../../../../../components/message/content/ThreadMetricsFollow';
import ThreadMetricsUnreadBadge from '../../../../../components/message/content/ThreadMetricsUnreadBadge';
import type { ThreadListMessageSurfaceProps } from '../layout/ThreadListMessageSurface';
import ThreadListMessageSurface from '../layout/ThreadListMessageSurface';
import ThreadUnreadBadgeSlot from '../layout/ThreadUnreadBadgeSlot';

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
} & ThreadListMessageSurfaceProps;

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
	const formatDate = useTimeAgo();

	return (
		<ThreadListMessageSurface className={className} {...props}>
			<MessageLeftContainer>
				<MessageAvatar emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined} username={username} size='x36' />
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageName title={username}>{name}</MessageName>
					<MessageTimestamp>{formatDate(ts)}</MessageTimestamp>
					{hasDraft && <MessageStatusIndicatorItem name='pencil' title={t('Thread_draft')} />}
				</MessageHeader>
				<MessageBody clamp={2}>{msg}</MessageBody>
				<ThreadListMetrics lm={tlm} participants={participants || []} counter={replies} />
			</MessageContainer>
			<MessageContainerFixed>
				<ThreadMetricsFollow following={following} mid={_id} rid={rid} mention={false} unread={false} all={false} />
				{unread && (
					<ThreadUnreadBadgeSlot>
						<ThreadMetricsUnreadBadge unread={unread} mention={mention} all={all} />
					</ThreadUnreadBadgeSlot>
				)}
			</MessageContainerFixed>
		</ThreadListMessageSurface>
	);
};

export default memo(ThreadListMessage);
