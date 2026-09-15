import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionChannelProps = {
	mention: string;
};

const className = 'rcx-message__highlight rcx-message__highlight--link';

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => {
	const { resolveChannelMention } = useContext(ComposerMarkupContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);

	if (!resolved) {
		return <span className={className}>#{mention}</span>;
	}

	return <span className={className}>#{resolved.fname ?? mention}</span>;
};

export default memo(ComposerMentionChannel);
