import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerSpoilerSpanProps = {
	children: MessageParser.Spoiler['value'];
};

const spoilerStyle = {
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.08))',
	borderRadius: '2px',
	padding: '0 2px',
} as const;

const ComposerSpoilerSpan = ({ children }: ComposerSpoilerSpanProps): ReactElement => (
	<>
		||
		<span style={spoilerStyle}>
			<ComposerInlineElements>{children}</ComposerInlineElements>
		</span>
		||
	</>
);

export default ComposerSpoilerSpan;
