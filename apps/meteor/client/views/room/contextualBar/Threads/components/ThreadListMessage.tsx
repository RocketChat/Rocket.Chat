import { IMessage } from '@rocket.chat/core-typings';
import { Message, Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, memo, MouseEventHandler, ReactElement, ReactNode } from 'react';

import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import * as NotificationStatus from '../../../../../components/message/NotificationStatus';
import { followStyle, anchor } from '../../../../../components/message/helpers/followSyle';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

type ThreadListMessageProps = {
	_id: IMessage['_id'];
	msg: IMessage['msg'];
	following: boolean;
	username: IMessage['u']['username'];
	name?: IMessage['u']['name'];
	ts: IMessage['ts'];
	replies: IMessage['replies'];
	participants: ReactNode;
	handleFollowButton: MouseEventHandler;
	unread: boolean;
	mention: number;
	all: boolean;
	tlm: number;
	className?: string | string[];
} & Omit<ComponentProps<typeof Message>, 'className'>;

function ThreadListMessage({
	_id,
	msg,
	following,
	username,
	name = username,
	ts,
	replies,
	participants,
	handleFollowButton,
	unread,
	mention,
	all,
	tlm,
	className = [],
	...props
}: ThreadListMessageProps): ReactElement {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const button = !following ? 'bell-off' : 'bell';
	const actionLabel = t(!following ? 'Not_Following' : 'Following');
	return (
		<Box className={[className, !following && followStyle].flat()} pb='x8'>
			<Message {...props}>
				<Message.LeftContainer>
					<UserAvatar username={username} className='rcx-message__avatar' size='x36' />
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{name}</Message.Name>
						<Message.Timestamp>{formatDate(ts)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2}>
						<RawText>{msg}</RawText>
					</Message.Body>
					<Message.Block>
						<Message.Metrics>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='thread' />
								<Message.Metrics.Item.Label>{replies}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='user' />
								<Message.Metrics.Item.Label>{participants}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='clock' />
								<Message.Metrics.Item.Label>{formatDate(tlm)}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
						</Message.Metrics>
					</Message.Block>
				</Message.Container>
				<Message.ContainerFixed>
					<IconButton
						className={anchor}
						small
						icon={button}
						flexShrink={0}
						data-following={following}
						data-id={_id}
						onClick={handleFollowButton}
						title={actionLabel}
						aria-label={actionLabel}
					/>
					<Box mb={24}>
						{(mention && <NotificationStatus.Me />) || (all && <NotificationStatus.All />) || (unread && <NotificationStatus.Unread />)}
					</Box>
				</Message.ContainerFixed>
			</Message>
		</Box>
	);
}

export default memo(ThreadListMessage);
