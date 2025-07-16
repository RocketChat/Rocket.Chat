import type { IMessage } from '@rocket.chat/core-typings';
import { MessageMetricsItem, MessageMetricsFollowing } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback } from 'react';

import ThreadMetricsBadge from './ThreadMetricsUnreadBadge';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';

type ThreadMetricsFollowProps = {
	following: boolean;
	mid: IMessage['_id'];
	rid: IMessage['rid'];
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const ThreadMetricsFollow = ({ following, mid, rid, unread, mention, all }: ThreadMetricsFollowProps): ReactElement => {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const toggleFollowingThreadMutation = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleFollow = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			toggleFollowingThreadMutation.mutate({ rid, tmid: mid, follow: !following });
		},
		[following, rid, mid, toggleFollowingThreadMutation],
	);

	return (
		<MessageMetricsItem data-rid={rid}>
			<MessageMetricsFollowing
				title={t(following ? 'Following' : 'Not_following')}
				name={following ? 'bell' : 'bell-off'}
				onClick={handleFollow}
				badge={<ThreadMetricsBadge unread={unread} mention={mention} all={all} />}
			/>
		</MessageMetricsItem>
	);
};

export default ThreadMetricsFollow;
