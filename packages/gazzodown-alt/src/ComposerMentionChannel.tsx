import type { ReactElement } from 'react';
import { memo, useContext } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionChannelProps = {
	mention: string;
};

const className = 'rcx-message__highlight rcx-message__highlight--link';

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => {
	const { resolveChannelMention } = useContext(ComposerMarkupContext);
	const resolved = resolveChannelMention?.(mention);

	return (
		<span className={className} {...(resolved && { 'data-rid': resolved._id })}>
			#{mention}
		</span>
	);
};

export default memo(ComposerMentionChannel);
