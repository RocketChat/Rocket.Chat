import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerStrikeSpanProps = {
	children: MessageParser.Strike['value'];
};

const ComposerStrikeSpan = ({ children }: ComposerStrikeSpanProps): ReactElement => (
	<>
		~
		<del>
			<ComposerInlineElements>{children}</ComposerInlineElements>
		</del>
		~
	</>
);

export default ComposerStrikeSpan;
