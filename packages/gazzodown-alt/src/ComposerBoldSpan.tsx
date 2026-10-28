import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerBoldSpanProps = {
	children: MessageParser.Bold['value'];
};

const ComposerBoldSpan = ({ children }: ComposerBoldSpanProps): ReactElement => (
	<>
		*
		<strong>
			<ComposerInlineElements>{children}</ComposerInlineElements>
		</strong>
		*
	</>
);

export default ComposerBoldSpan;
