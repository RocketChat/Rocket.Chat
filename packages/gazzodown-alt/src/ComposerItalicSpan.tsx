import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { renderInlineBlock } from './renderInlineBlock';

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Italic>
	| MessageParser.InlineCode;

type ComposerItalicSpanProps = {
	children: MessageBlock[];
};

const ComposerItalicSpan = ({ children }: ComposerItalicSpanProps): ReactElement => (
	<>
		_<em>{children.map((block, index) => renderInlineBlock(block, index))}</em>_
	</>
);

export default ComposerItalicSpan;
