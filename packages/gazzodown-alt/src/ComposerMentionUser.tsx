import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionUserProps = {
	mention: string;
};

const highlightClassName = (variant: 'relevant' | 'other'): string => `rcx-message__highlight rcx-message__highlight--${variant}`;

const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => {
	const { resolveUserMention } = useContext(ComposerMarkupContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);

	const className = highlightClassName(mention === 'all' || mention === 'here' ? 'relevant' : 'other');

	if (!resolved) {
		return <span className={className}>@{mention}</span>;
	}

	return (
		<span className={className} data-uid={resolved._id}>
			@{resolved.username ?? mention}
		</span>
	);
};

export default memo(ComposerMentionUser);
