import { Message } from '@rocket.chat/fuselage';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const handleChannelMention = (mention: string, withSymbol: boolean | undefined): string => (withSymbol ? `#${mention}` : mention);

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const { resolveChannelMention, onChannelMentionClick, useMentionSymbols } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);

	if (!resolved) {
		return <>#{mention}</>;
	}

	return (
		<Message.Highlight variant='link' clickable onClick={handleClick}>
			{handleChannelMention(resolved.name ?? mention, useMentionSymbols)}
		</Message.Highlight>
	);
};

export default memo(ChannelMentionElement);
