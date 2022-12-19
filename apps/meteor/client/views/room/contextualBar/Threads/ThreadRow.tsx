import type { IMessage } from '@rocket.chat/core-typings';
import type { MouseEvent, ReactElement } from 'react';
import React, { memo } from 'react';

import { useDecryptedMessage } from '../../../../hooks/useDecryptedMessage';
import { clickableItem } from '../../../../lib/clickableItem';
import { normalizeThreadMessage } from '../../../../lib/normalizeThreadMessage';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';
import ThreadListMessage from './components/ThreadListMessage';
import { mapProps } from './mapProps';

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

function ThreadRow({ thread, showRealNames, unread, unreadUser, unreadGroup, userId, onClick }: ThreadRowProps): ReactElement {
	const decryptedMsg = useDecryptedMessage(thread);
	const msg = normalizeThreadMessage({ ...thread, msg: decryptedMsg });

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
			following={thread.replies?.includes(userId)}
			data-id={thread._id}
			msg={msg}
			handleFollowButton={(e: MouseEvent<HTMLElement>): unknown => handleFollowButton(e, thread._id)}
			onClick={onClick}
		/>
	);
}

export default memo(ThreadRow);
