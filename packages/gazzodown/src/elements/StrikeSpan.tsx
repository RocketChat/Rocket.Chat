import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import CodeElement from '../code/CodeElement';
import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';

type MessageBlock =
	| MessageParser.Timestamp
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Strike>
	| MessageParser.InlineCode;

type StrikeSpanProps = {
	children: MessageBlock[];
};

const StrikeSpan = ({ children }: StrikeSpanProps): ReactElement => (
	<>
		{children.map((block, index) => {
			if (
				block.type === 'LINK' ||
				block.type === 'PLAIN_TEXT' ||
				block.type === 'ITALIC' ||
				block.type === 'BOLD' ||
				block.type === 'INLINE_CODE'
			) {
				return <del key={index}>{renderBlockComponent(block, index)}</del>;
			}
			return renderBlockComponent(block, index);
		})}
	</>
);

const renderBlockComponent = (block: MessageBlock, index: number): ReactElement | null => {
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

		case 'ITALIC':
			return <ItalicSpan key={index} children={block.value} />;

		case 'BOLD':
			return <BoldSpan key={index} children={block.value} />;

		case 'INLINE_CODE':
			return <CodeElement key={index} code={block.value.value} />;

		default:
			return null;
	}
};

export default StrikeSpan;
