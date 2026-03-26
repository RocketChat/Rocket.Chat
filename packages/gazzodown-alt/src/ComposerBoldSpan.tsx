import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { renderInlineBlock } from './renderInlineBlock';

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Bold>
	| MessageParser.InlineCode;

type ComposerBoldSpanProps = {
	children: MessageBlock[];
};

const ComposerBoldSpan = ({ children }: ComposerBoldSpanProps): ReactElement => (
	<>
		*<strong>{children.map((block, index) => renderInlineBlock(block, index))}</strong>*
	</>
);

export default ComposerBoldSpan;
