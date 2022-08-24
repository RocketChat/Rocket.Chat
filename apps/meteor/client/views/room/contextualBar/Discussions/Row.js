import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { clickableItem } from '../../../../lib/clickableItem';
import { normalizeThreadMessage } from '../../../../lib/normalizeThreadMessage';
import DiscussionListMessage from './components/Message';
import { mapProps } from './mapProps';

const Discussion = memo(mapProps(clickableItem(DiscussionListMessage)));

const Row = memo(function Row({ discussion, showRealNames, userId, onClick }) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return (
		<Discussion
			replies={discussion.replies}
			dcount={discussion.dcount}
			dlm={discussion.dlm}
			name={showRealNames ? name : discussion.u.username}
			username={discussion.u.username}
			following={discussion.replies && discussion.replies.includes(userId)}
			data-drid={discussion.drid}
			msg={msg}
			t={t}
			formatDate={formatDate}
			onClick={onClick}
		/>
	);
});

export default Row;
