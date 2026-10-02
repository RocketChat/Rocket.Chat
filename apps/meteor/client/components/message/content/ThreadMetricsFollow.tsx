import type { IMessage } from '@rocket.chat/core-typings';
import { MessageMetricsItem, MessageMetricsFollowing } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';

import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';

export type ThreadMetricsFollowProps = {
	following: boolean;
	mid: IMessage['_id'];
	rid: IMessage['rid'];
};

const ThreadMetricsFollow = ({ following, mid, rid }: ThreadMetricsFollowProps) => {
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
			/>
		</MessageMetricsItem>
	);
};

export default ThreadMetricsFollow;
