import type { ReactElement } from 'react';

import { sanitizeUrl } from './sanitizeUrl';

type ComposerLinkSpanProps = {
	href: string;
	text: string;
};

const linkStyle = {
	color: 'var(--rcx-color-font-info, #095ad2)',
	textDecoration: 'underline',
} as const;

const ComposerLinkSpan = ({ href, text }: ComposerLinkSpanProps): ReactElement => (
	<a href={sanitizeUrl(href)} rel='noopener noreferrer' style={linkStyle}>
		{text}
	</a>
);

export default ComposerLinkSpan;
