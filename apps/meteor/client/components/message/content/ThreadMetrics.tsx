import {
	MessageMetricsItem,
	MessageBlock,
	MessageMetrics,
	MessageMetricsReply,
	MessageMetricsFollowing,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
	MessageMetricsItemAvatarRow,
	Badge,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import { followStyle, anchor } from '../helpers/followSyle';
import ThreadMetricAvatar from './ThreadMetricAvatar';

type ThreadMetricsProps = {
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	mid: string;
	rid: string;
	counter: number;
	participants: Array<string>;
	following: boolean;
};

const getBadgeVariant = (unread: boolean, mention: boolean, all: boolean) => {
	if (!unread) {
		return false;
	}

	if (mention) {
		return 'danger';
	}

	if (all) {
		return 'warning';
	}

	return 'primary';
};

const ThreadMetrics = ({ unread, mention, all, rid, mid, counter, participants, following, lm }: ThreadMetricsProps): ReactElement => {
	const { t } = useTranslation();

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

	const unreadBadgeVariant = getBadgeVariant(unread, mention, all);

	return (
		<MessageBlock className={followStyle}>
			<MessageMetrics>
				<MessageMetricsReply
					data-rid={rid}
					data-mid={mid}
					onClick={() => goToThread({ rid, tmid: mid })}
					primary={!!unread}
					position='relative'
					overflow='visible'
					badge={unreadBadgeVariant ? <Badge variant={unreadBadgeVariant}>!</Badge> : undefined}
				>
					{t('View_thread')}
				</MessageMetricsReply>
				<MessageMetricsItem className={!following ? anchor : undefined} data-rid={rid}>
					<MessageMetricsFollowing
						title={following ? t('Following') : t('Not_following')}
						name={following ? 'bell' : 'bell-off'}
						onClick={handleFollow}
					/>
				</MessageMetricsItem>
				{!!participants && (
					<MessageMetricsItem title={t('Participants')}>
						<MessageMetricsItemAvatarRow>
							{participants.slice(0, 2).map((uid) => (
								<ThreadMetricAvatar userId={uid} key={uid} />
							))}
						</MessageMetricsItemAvatarRow>
						{participants.length - 2 > 0 && (
							<MessageMetricsItemLabel>{t('__count__participants', { count: participants.length - 2 })}</MessageMetricsItemLabel>
						)}
					</MessageMetricsItem>
				)}
				<MessageMetricsItem title={t('Last_message__date__', { date: format(lm) })}>
					<MessageMetricsItemIcon name='thread' />
					<MessageMetricsItemLabel>{t('__count__replies__date__', { count: counter, date: format(lm) })}</MessageMetricsItemLabel>
				</MessageMetricsItem>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default ThreadMetrics;
