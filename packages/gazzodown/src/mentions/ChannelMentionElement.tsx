import { Message } from '@rocket.chat/fuselage';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const { resolveChannelMention, onChannelMentionClick } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);

	if (!resolved) {
		return <>#{mention}</>;
	}

	return (
		<Message.Highlight variant='link' clickable onClick={handleClick}>
			{resolved.name ?? mention}
		</Message.Highlight>
	);
};

export default memo(ChannelMentionElement);
