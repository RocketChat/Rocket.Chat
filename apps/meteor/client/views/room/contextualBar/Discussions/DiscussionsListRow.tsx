import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import type { MouseEvent } from 'react';
import { memo } from 'react';

import DiscussionsListItem from './components/DiscussionsListItem';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { normalizeThreadMessage } from '../../../../lib/normalizeThreadMessage';

type DiscussionListRowProps = {
	discussion: IDiscussionMessage;
	showRealNames: boolean;
	onClick: (e: MouseEvent<HTMLElement>) => void;
};

function DiscussionListRow({ discussion, showRealNames, onClick }: DiscussionListRowProps) {
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return (
		<DiscussionsListItem
			_id={discussion._id}
			emoji={discussion.emoji}
			dcount={discussion.dcount}
			dlm={discussion.dlm}
			name={showRealNames ? name : discussion.u.username}
			username={discussion.u.username}
			data-drid={discussion.drid}
			ts={discussion.ts}
			msg={msg}
			formatDate={formatDate}
			onClick={onClick}
		/>
	);
}

export default memo(DiscussionListRow);
