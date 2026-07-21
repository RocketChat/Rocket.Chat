import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { renderInlineBlock } from './renderInlineBlock';

type MessageBlock =
	| MessageParser.Timestamp
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Strike>
	| MessageParser.InlineCode;

type ComposerStrikeSpanProps = {
	children: MessageBlock[];
};

const ComposerStrikeSpan = ({ children }: ComposerStrikeSpanProps): ReactElement => (
	<>
		~<del>{children.map((block, index) => renderInlineBlock(block, index))}</del>~
	</>
);

export default ComposerStrikeSpan;
