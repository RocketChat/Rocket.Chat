import { Message } from '@rocket.chat/fuselage';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import { useMentionsWithSymbol } from './useMentionsWithSymbol';

type UserMentionElementProps = {
	mention: string;
};

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const { resolveUserMention, onUserMentionClick, isMobile, ownUserId, useRealName } = useContext(MarkupInteractionContext);
	const handleMention = useMentionsWithSymbol();

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleClick = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	const showRealName = useRealName && !isMobile;

	if (mention === 'all') {
		return <Message.Highlight variant='relevant'>{handleMention('all')}</Message.Highlight>;
	}

	if (mention === 'here') {
		return <Message.Highlight variant='relevant'>{handleMention('here')}</Message.Highlight>;
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<Message.Highlight
			variant={resolved._id === ownUserId ? 'critical' : 'other'}
			title={resolved.username || resolved.name}
			clickable
			onClick={handleClick}
			data-uid={resolved._id}
		>
			{handleMention(showRealName ? resolved.name : resolved.username) ?? handleMention(mention)}
		</Message.Highlight>
	);
};

export default memo(UserMentionElement);
