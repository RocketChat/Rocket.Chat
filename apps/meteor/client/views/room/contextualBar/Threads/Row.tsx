import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, MouseEvent } from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { clickableItem } from '../../../../lib/clickableItem';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';
import ThreadListMessage from './components/Message';
import { mapProps } from './mapProps';
import { normalizeThreadMessage } from './normalizeThreadMessage';

const Thread = memo(mapProps(clickableItem(ThreadListMessage)));

const handleFollowButton = (e: MouseEvent<HTMLElement>, threadId: string): void => {
	e.preventDefault();
	e.stopPropagation();
	const { following } = e.currentTarget.dataset;

	following &&
		callWithErrorHandling(![true, 'true'].includes(following) ? 'followMessage' : 'unfollowMessage', {
			mid: threadId,
		});
};

type ThreadRowProps = {
	thread: IMessage;
	showRealNames: boolean;
	unread: string[];
	unreadUser: string[];
	unreadGroup: string[];
	userId: string;
	onClick: (threadId: string) => void;
};

const Row: FC<ThreadRowProps> = memo(function Row({ thread, showRealNames, unread, unreadUser, unreadGroup, userId, onClick }) {
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
			handleFollowButton={(e: MouseEvent<HTMLElement>): unknown => handleFollowButton(e, thread._id)}
			onClick={onClick}
		/>
	);
});

export default Row;
