import React, { memo } from 'react';

import { call } from '../../../../../app/ui-utils/client';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { clickableItem } from '../../../../lib/clickableItem';
import ThreadListMessage from './components/Message';
import { mapProps } from './mapProps';
import { normalizeThreadMessage } from './normalizeThreadMessage';

const Thread = memo(mapProps(clickableItem(ThreadListMessage)));

const handleFollowButton = (e, threadId) => {
	e.preventDefault();
	e.stopPropagation();
	call(
		![true, 'true'].includes(e.currentTarget.dataset.following)
			? 'followMessage'
			: 'unfollowMessage',
		{ mid: threadId },
	);
};

const Row = memo(function Row({
	thread,
	showRealNames,
	unread,
	unreadUser,
	unreadGroup,
	userId,
	onClick,
}) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(thread);

	const { name = thread.u.username } = thread.u;

	return (
		<Thread
			tcount={thread.tcount}
			tlm={thread.tlm}
			ts={thread.ts}
			u={thread.u}
			replies={thread.replies}
			name={showRealNames ? name : thread.u.username}
			username={thread.u.username}
			unread={unread.includes(thread._id)}
			mention={unreadUser.includes(thread._id)}
			all={unreadGroup.includes(thread._id)}
			following={thread.replies && thread.replies.includes(userId)}
			data-id={thread._id}
			msg={msg}
			t={t}
			formatDate={formatDate}
			handleFollowButton={(e) => handleFollowButton(e, thread._id)}
			onClick={onClick}
		/>
	);
});

export default Row;
