import { useUserId } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useMemo } from 'react';

import { useMessageBodyUserMentions, useMessageBodyMentionClick } from '../MarkupInteractionContext';

type UserMentionElementProps = {
	mention: string;
};

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const uid = useUserId();
	const mentions = useMessageBodyUserMentions();
	const mentioned = mentions.find((mentioned) => mentioned.username === mention);
	const onUserMentionClick = useMessageBodyMentionClick();

	const classNames = useMemo(() => {
		if (mention === 'all') {
			return 'mention-link mention-link--all mention-link--group';
		}

		if (mention === 'here') {
			return 'mention-link mention-link--here mention-link--group';
		}

		if (mentioned && mentioned._id === uid) {
			return 'mention-link mention-link--me mention-link--user';
		}

		return 'mention-link mention-link--user';
	}, [mention, mentioned, uid]);

	if (!mentioned) {
		return <>@{mention}</>;
	}

	return (
		<span className={classNames} onClick={mention !== 'all' && mention !== 'here' ? onUserMentionClick(mention) : undefined}>
			{mentioned.name || mention}
		</span>
	);
};

export default memo(UserMentionElement);
