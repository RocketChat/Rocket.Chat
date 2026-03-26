import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan';
import ComposerCodeElement from './ComposerCodeElement';
import ComposerEmojiElement from './ComposerEmojiElement';
import ComposerLinkSpan from './ComposerLinkSpan';
import ComposerMentionChannel from './ComposerMentionChannel';
import ComposerMentionUser from './ComposerMentionUser';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerStrikeSpan from './ComposerStrikeSpan';

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
		_<em>{children.map((block, index) => renderBlockComponent(block, index))}</em>_
	</>
);

const renderBlockComponent = (block: MessageBlock, index: number): ReactElement | null => {
	switch (block.type) {
		case 'EMOJI':
			return <ComposerEmojiElement key={index} {...block} />;

		case 'MENTION_USER':
			return <ComposerMentionUser key={index} mention={block.value.value} />;

		case 'MENTION_CHANNEL':
			return <ComposerMentionChannel key={index} mention={block.value.value} />;

		case 'PLAIN_TEXT':
			return <ComposerPlainSpan key={index} text={block.value} />;

		case 'LINK':
			return <ComposerLinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

		case 'STRIKE':
			return <ComposerStrikeSpan key={index}>{block.value}</ComposerStrikeSpan>;

		case 'BOLD':
			return <ComposerBoldSpan key={index}>{block.value}</ComposerBoldSpan>;

		case 'INLINE_CODE':
			return <ComposerCodeElement key={index} code={block.value.value} />;

		default:
			return null;
	}
};

export default ComposerItalicSpan;
