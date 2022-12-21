import { Message, MessageMetricsItem, MessageBlock } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import React, { useCallback } from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { followStyle, anchor } from '../helpers/followSyle';
import AllMentionNotification from '../notification/AllMentionNotification';
import MeMentionNotification from '../notification/MeMentionNotification';
import UnreadMessagesNotification from '../notification/UnreadMessagesNotification';

type ThreadMetricProps = {
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	mid: string;
	rid: string;
	counter: number;
	participants: number;
	following: boolean;
	openThread: (e: MouseEvent) => void;
};

const ThreadMetric = ({
	unread,
	mention,
	all,
	rid,
	mid,
	counter,
	participants,
	following,
	lm,
	openThread,
}: ThreadMetricProps): ReactElement => {
	const t = useTranslation();

	const followMessage = useEndpoint('POST', '/v1/chat.followMessage');
	const unfollowMessage = useEndpoint('POST', '/v1/chat.unfollowMessage');
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
						{(mention && <MeMentionNotification />) || (all && <AllMentionNotification />) || (unread && <UnreadMessagesNotification />)}
					</MessageMetricsItem.Label>
				</MessageMetricsItem>
			</Message.Metrics>
		</MessageBlock>
	);
};

export default ThreadMetric;
