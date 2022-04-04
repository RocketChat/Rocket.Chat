import React, { useCallback, FC } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import * as NotificationStatus from '../NotificationStatus';
import { followStyle, anchor } from '../helpers/followSyle';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Content from './Content';
import Reply from './Reply';
import Metrics from './index';

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

const ThreadMetric: FC<ThreadReplyOptions> = ({ unread, mention, all, rid, mid, counter, participants, following, lm, openThread }) => {
	const t = useTranslation();

	const { className, ref } = useBlockRendered();

	const followMessage = useEndpoint('POST', 'chat.followMessage');
	const unfollowMessage = useEndpoint('POST', 'chat.unfollowMessage');
	const format = useTimeAgo();

	const handleFollow = useCallback(
		() => (following ? unfollowMessage({ mid }) : followMessage({ mid })),
		[followMessage, following, mid, unfollowMessage],
	);

	return (
		<Content className={followStyle}>
			<div className={className} ref={ref as any} />
			<Reply data-rid={rid} data-mid={mid} onClick={openThread}>
				{t('Reply')}
			</Reply>
			<Metrics>
				<Metrics.Item title={t('Replies')}>
					<Metrics.Item.Icon name='thread' />
					<Metrics.Item.Label>{counter}</Metrics.Item.Label>
				</Metrics.Item>
				{participants && (
					<Metrics.Item title={t('Participants')}>
						<Metrics.Item.Icon name='user' />
						<Metrics.Item.Label>{participants}</Metrics.Item.Label>
					</Metrics.Item>
				)}
				<Metrics.Item title={lm?.toLocaleString()}>
					<Metrics.Item.Icon name='clock' />
					<Metrics.Item.Label>{format(lm)}</Metrics.Item.Label>
				</Metrics.Item>
				<Metrics.Item
					className={!following ? anchor : undefined}
					title={t(following ? 'Following' : 'Not_following')}
					data-rid={rid}
					onClick={handleFollow}
				>
					<Metrics.Following name={following ? 'bell' : 'bell-off'} />
					<Metrics.Item.Label>
						{(mention && <NotificationStatus.Me t={t} />) ||
							(all && <NotificationStatus.All t={t} />) ||
							(unread && <NotificationStatus.Unread t={t} />)}
					</Metrics.Item.Label>
				</Metrics.Item>
			</Metrics>
		</Content>
	);
};

export default ThreadMetric;
