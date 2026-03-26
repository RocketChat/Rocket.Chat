import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionUserProps = {
	mention: string;
};

const mentionStyle = {
	fontWeight: 'bold' as const,
	color: 'var(--rcx-color-font-info, #156FF5)',
	cursor: 'default',
};

const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => {
	const { resolveUserMention } = useContext(ComposerMarkupContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);

	if (!resolved) {
		return <span style={mentionStyle}>@{mention}</span>;
	}

	return (
		<span style={mentionStyle} data-uid={resolved._id}>
			@{resolved.username ?? mention}
		</span>
	);
};

export default memo(ComposerMentionUser);
