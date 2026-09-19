import type { ReactElement } from 'react';
import { useContext } from 'react';
import { memo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionChannelProps = {
	mention: string;
};

const className = 'rcx-message__highlight rcx-message__highlight--link';

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => {
	const { resolveChannelMention } = useContext(ComposerMarkupContext);
	const resolved = resolveChannelMention?.(mention);

	return <span className={className}>#{resolved?.fname ?? resolved?.name ?? mention}</span>;
};

export default memo(ComposerMentionChannel);
