import { MessageMetricsItem, MessageBlock, MessageMetrics, MessageMetricsReply, MessageMetricsFollowing } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import { followStyle, anchor } from '../helpers/followSyle';
import AllMentionNotification from '../notification/AllMentionNotification';
import MeMentionNotification from '../notification/MeMentionNotification';
import UnreadMessagesNotification from '../notification/UnreadMessagesNotification';

type ThreadMetricsProps = {
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	mid: string;
	rid: string;
	counter: number;
	participants: number;
	following: boolean;
};

const ThreadMetrics = ({ unread, mention, all, rid, mid, counter, participants, following, lm }: ThreadMetricsProps): ReactElement => {
	const t = useTranslation();

	const format = useTimeAgo();

	const goToThread = useGoToThread();

	const dispatchToastMessage = useToastMessageDispatch();
	const toggleFollowingThreadMutation = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleFollow = useCallback(() => {
		toggleFollowingThreadMutation.mutate({ rid, tmid: mid, follow: !following });
	}, [following, rid, mid, toggleFollowingThreadMutation]);

	return (
		<MessageBlock className={followStyle}>
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-mid={mid} onClick={() => goToThread({ rid, tmid: mid })}>
					{t('Reply')}
				</MessageMetricsReply>
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
				<MessageMetricsItem className={!following ? anchor : undefined} data-rid={rid}>
					<MessageMetricsFollowing
						title={t(following ? 'Following' : 'Not_following')}
						name={following ? 'bell' : 'bell-off'}
						onClick={handleFollow}
					/>
				</MessageMetricsItem>
				{(mention || all || unread) && (
					<MessageMetricsItem>
						<MessageMetricsItem.Label>
							{(mention && <MeMentionNotification />) || (all && <AllMentionNotification />) || (unread && <UnreadMessagesNotification />)}
						</MessageMetricsItem.Label>
					</MessageMetricsItem>
				)}
			</MessageMetrics>
		</MessageBlock>
	);
};

export default ThreadMetrics;
