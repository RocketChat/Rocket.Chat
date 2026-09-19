import type { ReactElement } from 'react';
import { useContext } from 'react';
import { memo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionUserProps = {
	mention: string;
};

const highlightClassName = (variant: 'relevant' | 'other'): string => `rcx-message__highlight rcx-message__highlight--${variant}`;

const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => {
	const { resolveUserMention } = useContext(ComposerMarkupContext);
	const resolved = resolveUserMention?.(mention);

	return (
		<span className={highlightClassName(mention === 'all' || mention === 'here' ? 'relevant' : 'other')}>
			@{resolved?.username ?? mention}
		</span>
	);
};

export default memo(ComposerMentionUser);
