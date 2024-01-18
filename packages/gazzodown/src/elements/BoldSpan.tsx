import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { lazy } from 'react';

import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

const CodeElement = lazy(() => import('../code/CodeElement'));

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Bold>
	| MessageParser.InlineCode;

type BoldSpanProps = {
	children: MessageBlock[];
};

const BoldSpan = ({ children }: BoldSpanProps): ReactElement => (
	<>
		{children.map((block, index) => {
			if (
				block.type === 'LINK' ||
				block.type === 'PLAIN_TEXT' ||
				block.type === 'STRIKE' ||
				block.type === 'ITALIC' ||
				block.type === 'INLINE_CODE'
			) {
				return <strong key={index}>{renderBlockComponent(block, index)}</strong>;
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

		case 'ITALIC':
			return <ItalicSpan key={index} children={block.value} />;

		case 'INLINE_CODE':
			return <CodeElement key={index} code={block.value.value} />;

		default:
			return null;
	}
};

export default BoldSpan;
