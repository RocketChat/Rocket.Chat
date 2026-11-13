import type { IMessage } from '@rocket.chat/core-typings';
import { MessageMetricsItem, MessageMetricsFollowing } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadMetricsBadge, { getBadgeVariantAndTitle } from './ThreadMetricsUnreadBadge';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';

export type ThreadMetricsFollowProps = {
	following: boolean;
	mid: IMessage['_id'];
	rid: IMessage['rid'];
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const ThreadMetricsFollow = ({ following, mid, rid, unread, mention, all }: ThreadMetricsFollowProps) => {
	const { t } = useTranslation();

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

	const label = t(following ? 'Following' : 'Not_following');
	// The badge is hidden from assistive technology, so the unread state it shows goes into the button's name.
	const badge = getBadgeVariantAndTitle(unread, mention, all);

	return (
		<MessageMetricsItem data-rid={rid}>
			<MessageMetricsFollowing
				title={label}
				aria-label={badge ? `${label}, ${t(badge[1])}` : label}
				name={following ? 'bell' : 'bell-off'}
				onClick={handleFollow}
				badge={<ThreadMetricsBadge unread={unread} mention={mention} all={all} />}
			/>
		</MessageMetricsItem>
	);
};

export default ThreadMetricsFollow;
