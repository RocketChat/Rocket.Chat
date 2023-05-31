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
		<Message.Mention clickable tag='#' onClick={handleClick}>
			{resolved.name ?? mention}
		</Message.Mention>
	);
};

export default memo(ChannelMentionElement);
