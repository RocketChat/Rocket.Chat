import type { IDiscussionMessage, IUser } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { normalizeThreadMessage } from '../../../../lib/normalizeThreadMessage';
import DiscussionListMessage from './components/DiscussionsListItem';

type DiscussionListRowProps = {
	discussion: IDiscussionMessage;
	showRealNames: boolean;
	userId: IUser['_id'];
	onClick: (e: unknown) => void;
};

function DiscussionListRow({ discussion, showRealNames, userId, onClick }: DiscussionListRowProps) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return (
		<DiscussionListMessage
			replies={discussion.replies}
			dcount={discussion.dcount}
			dlm={discussion.dlm}
			name={showRealNames ? name : discussion.u.username}
			username={discussion.u.username}
			following={discussion.replies?.includes(userId)}
			data-drid={discussion.drid}
			ts={discussion.ts}
			msg={msg}
			t={t}
			formatDate={formatDate}
			onClick={onClick}
		/>
	);
}

export default memo(DiscussionListRow);
