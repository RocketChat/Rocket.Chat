import type { IMessage } from '@rocket.chat/core-typings';
import { MessageMetricsItem, MessageMetricsFollowing } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadMetricsBadge from './ThreadMetricsUnreadBadge';
import { useMessageInteractions } from '../contexts/MessageInteractionsContext';

export type ThreadMetricsFollowProps = {
	/** The thread's main message. */
	message: IMessage;
	following: boolean;
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const ThreadMetricsFollow = ({ message, following, unread, mention, all }: ThreadMetricsFollowProps) => {
	const { t } = useTranslation();
	const { followThread, unfollowThread } = useMessageInteractions();

	const handleFollow = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (following) {
			unfollowThread(message);
			return;
		}

		followThread(message);
	};

	return (
		<MessageMetricsItem data-rid={message.rid}>
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
