import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';
import BoldSpan from './BoldSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Italic>;

type ItalicSpanProps = {
	children: MessageBlock[];
};

const ItalicSpan = ({ children }: ItalicSpanProps): ReactElement => (
	<>
		{children.map((block, index) => {
			if (block.type === 'LINK' || block.type === 'PLAIN_TEXT' || block.type === 'STRIKE' || block.type === 'BOLD') {
				return <em key={index}>{renderBlockComponent(block, index)}</em>;
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

		case 'STRIKE':
			return <StrikeSpan key={index} children={block.value} />;

		case 'BOLD':
			return <BoldSpan key={index} children={block.value} />;

		default:
			return null;
	}
};

export default ItalicSpan;
