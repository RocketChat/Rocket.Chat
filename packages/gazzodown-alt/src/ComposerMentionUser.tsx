import type { ReactElement } from 'react';
import { memo, useContext } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerMentionUserProps = {
	mention: string;
};

const highlightClassName = (variant: 'relevant' | 'other'): string => `rcx-message__highlight rcx-message__highlight--${variant}`;

const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => {
	const { resolveUserMention } = useContext(ComposerMarkupContext);

	if (mention === 'all' || mention === 'here') {
		return <span className={highlightClassName('relevant')}>@{mention}</span>;
	}

	const resolved = resolveUserMention ? resolveUserMention(mention) : true;

	if (!resolved) {
		return <>@{mention}</>;
	}

	return <span className={highlightClassName('other')}>@{mention}</span>;
};

export default memo(ComposerMentionUser);
