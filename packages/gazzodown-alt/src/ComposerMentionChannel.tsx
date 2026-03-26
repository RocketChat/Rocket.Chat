import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionChannelProps = {
	mention: string;
};

const mentionStyle = {
	fontWeight: 'bold' as const,
	color: 'var(--rcx-color-font-info, #156FF5)',
	cursor: 'default',
};

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => {
	const { resolveChannelMention } = useContext(ComposerMarkupContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);

	if (!resolved) {
		return <span style={mentionStyle}>#{mention}</span>;
	}

	return <span style={mentionStyle}>#{resolved.fname ?? mention}</span>;
};

export default memo(ComposerMentionChannel);
