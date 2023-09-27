import { Message } from '@rocket.chat/fuselage';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type UserMentionElementProps = {
	mention: string;
};

const handleUserMention = (mention: string | undefined, withSymbol: boolean | undefined): string | undefined =>
	withSymbol ? `@${mention}` : mention;

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const { resolveUserMention, onUserMentionClick, isMobile, ownUserId, useRealName, showMentionSymbol } =
		useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleClick = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	const showRealName = useRealName && !isMobile;

	if (mention === 'all') {
		return <Message.Highlight variant='relevant'>{handleUserMention('all', showMentionSymbol)}</Message.Highlight>;
	}

	if (mention === 'here') {
		return <Message.Highlight variant='relevant'>{handleUserMention('here', showMentionSymbol)}</Message.Highlight>;
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
			{handleUserMention((showRealName ? resolved.name : resolved.username) ?? mention, showMentionSymbol)}
		</Message.Highlight>
	);
};

export default memo(UserMentionElement);
