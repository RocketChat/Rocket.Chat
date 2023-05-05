import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const ChannelMention = styled('span')`
	color: ${Palette.statusColor['status-font-on-info'].toString()};
	cursor: pointer;
	font-weight: 700;
	font-size: 0.875rem;
	line-height: 1.25rem;
	&:hover {
		text-decoration: underline;
	}
`;

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const { resolveChannelMention, onChannelMentionClick } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);

	if (!resolved) {
		return <>#{mention}</>;
	}

	return <ChannelMention onClick={handleClick}>#{resolved.name ?? mention}</ChannelMention>;
};

export default memo(ChannelMentionElement);
