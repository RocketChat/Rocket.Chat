import type { ReactElement } from 'react';
import { memo } from 'react';

type ComposerMentionUserProps = {
	mention: string;
};

const highlightClassName = (variant: 'relevant' | 'other'): string => `rcx-message__highlight rcx-message__highlight--${variant}`;

// TODO: Once implemented add mention resolution logic
const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => (
	<span className={highlightClassName(mention === 'all' || mention === 'here' ? 'relevant' : 'other')}>@{mention}</span>
);

export default memo(ComposerMentionUser);
