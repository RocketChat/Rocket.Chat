import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './BoldSpan.js';
import LinkSpan from './LinkSpan.js';
import PlainSpan from './PlainSpan.js';
import StrikeSpan from './StrikeSpan.js';
import CodeElement from '../code/CodeElement.js';
import EmojiElement from '../emoji/EmojiElement.js';
import ChannelMentionElement from '../mentions/ChannelMentionElement.js';
import UserMentionElement from '../mentions/UserMentionElement.js';

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Italic>
	| MessageParser.InlineCode;

export type ItalicSpanProps = {
	children: MessageBlock[];
};

const ItalicSpan = ({ children }: ItalicSpanProps) => (
	<>
		{children.map((block, index) => {
			if (
				block.type === 'LINK' ||
				block.type === 'PLAIN_TEXT' ||
				block.type === 'STRIKE' ||
				block.type === 'BOLD' ||
				block.type === 'INLINE_CODE'
			) {
				return <em key={index}>{renderBlockComponent(block, index)}</em>;
			}
			return renderBlockComponent(block, index);
		})}
	</>
);

const renderBlockComponent = (block: MessageBlock, index: number) => {
	switch (block.type) {
		case 'EMOJI':
			return <EmojiElement key={index} {...block} />;

		case 'MENTION_USER':
			return <UserMentionElement key={index} mention={block.value.value} />;

		case 'MENTION_CHANNEL':
			return <ChannelMentionElement key={index} mention={block.value.value} />;

		case 'PLAIN_TEXT':
			return <PlainSpan key={index} text={block.value} />;

		case 'LINK':
			return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

		case 'STRIKE':
			return <StrikeSpan key={index}>{block.value}</StrikeSpan>;

		case 'BOLD':
			return <BoldSpan key={index}>{block.value}</BoldSpan>;

		case 'INLINE_CODE':
			return <CodeElement key={index} code={block.value.value} />;

		default:
			return null;
	}
};

export default ItalicSpan;
