import { Message } from '@rocket.chat/fuselage';
import React, { useCallback, FC } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
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
	openThread: () => any;
};

const ThreadMetric: FC<ThreadReplyOptions> = ({
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
}) => {
	const t = useTranslation();

	const followMessage = useEndpoint('POST', 'chat.followMessage');
	const unfollowMessage = useEndpoint('POST', 'chat.unfollowMessage');
	const format = useTimeAgo();

	const handleFollow = useCallback(
		() => (following ? unfollowMessage({ mid }) : followMessage({ mid })),
		[followMessage, following, mid, unfollowMessage],
	);

	return (
		<Message.Block className={followStyle}>
			<Message.Metrics>
				<Message.Metrics.Reply data-rid={rid} data-mid={mid} onClick={openThread}>
					{t('Reply')}
				</Message.Metrics.Reply>
				<Message.Metrics.Item title={t('Replies')}>
					<Message.Metrics.Item.Icon name='thread' />
					<Message.Metrics.Item.Label>{counter}</Message.Metrics.Item.Label>
				</Message.Metrics.Item>
				{!!participants && (
					<Message.Metrics.Item title={t('Participants')}>
						<Message.Metrics.Item.Icon name='user' />
						<Message.Metrics.Item.Label>{participants}</Message.Metrics.Item.Label>
					</Message.Metrics.Item>
				)}
				<Message.Metrics.Item title={lm?.toLocaleString()}>
					<Message.Metrics.Item.Icon name='clock' />
					<Message.Metrics.Item.Label>{format(lm)}</Message.Metrics.Item.Label>
				</Message.Metrics.Item>
				<Message.Metrics.Item
					className={!following ? anchor : undefined}
					title={t(following ? 'Following' : 'Not_following')}
					data-rid={rid}
					onClick={handleFollow}
				>
					<Message.Metrics.Following name={following ? 'bell' : 'bell-off'} />
				</Message.Metrics.Item>
				<Message.Metrics.Item>
					<Message.Metrics.Item.Label>
						{(mention && <NotificationStatus.Me t={t} />) ||
							(all && <NotificationStatus.All t={t} />) ||
							(unread && <NotificationStatus.Unread t={t} />)}
					</Message.Metrics.Item.Label>
				</Message.Metrics.Item>
			</Message.Metrics>
		</Message.Block>
	);
};

export default ThreadMetric;
