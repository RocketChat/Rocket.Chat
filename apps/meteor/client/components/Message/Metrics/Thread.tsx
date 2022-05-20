import { Message, MessageMetricsItem, MessageBlock } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, FC, MouseEvent as ReactMouseEvent } from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import * as NotificationStatus from '../NotificationStatus';
import { followStyle, anchor } from '../helpers/followSyle';

type ThreadReplyOptions = {
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	mid: string;
	rid: string;
	counter: number;
	participants: number;
	following: boolean;
	openThread: (e: ReactMouseEvent<Element, MouseEvent>) => void;
};

const ThreadMetric: FC<ThreadReplyOptions> = ({ unread, mention, all, rid, mid, counter, participants, following, lm, openThread }) => {
	const t = useTranslation();

	const followMessage = useEndpoint('POST', 'chat.followMessage');
	const unfollowMessage = useEndpoint('POST', 'chat.unfollowMessage');
	const format = useTimeAgo();

	const handleFollow = useCallback(
		() => (following ? unfollowMessage({ mid }) : followMessage({ mid })),
		[followMessage, following, mid, unfollowMessage],
	);

	return (
		<MessageBlock className={followStyle}>
			<Message.Metrics>
				<Message.Metrics.Reply data-rid={rid} data-mid={mid} onClick={openThread}>
					{t('Reply')}
				</Message.Metrics.Reply>
				<MessageMetricsItem title={t('Replies')}>
					<MessageMetricsItem.Icon name='thread' />
					<MessageMetricsItem.Label>{counter}</MessageMetricsItem.Label>
				</MessageMetricsItem>
				{!!participants && (
					<MessageMetricsItem title={t('Participants')}>
						<MessageMetricsItem.Icon name='user' />
						<MessageMetricsItem.Label>{participants}</MessageMetricsItem.Label>
					</MessageMetricsItem>
				)}
				<MessageMetricsItem title={lm?.toLocaleString()}>
					<MessageMetricsItem.Icon name='clock' />
					<MessageMetricsItem.Label>{format(lm)}</MessageMetricsItem.Label>
				</MessageMetricsItem>
				<MessageMetricsItem
					className={!following ? anchor : undefined}
					title={t(following ? 'Following' : 'Not_following')}
					data-rid={rid}
					onClick={handleFollow}
				>
					<Message.Metrics.Following name={following ? 'bell' : 'bell-off'} />
				</MessageMetricsItem>
				<MessageMetricsItem>
					<MessageMetricsItem.Label>
						{(mention && <NotificationStatus.Me />) || (all && <NotificationStatus.All />) || (unread && <NotificationStatus.Unread />)}
					</MessageMetricsItem.Label>
				</MessageMetricsItem>
			</Message.Metrics>
		</MessageBlock>
	);
};

export default ThreadMetric;
