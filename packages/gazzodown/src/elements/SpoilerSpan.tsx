import type * as MessageParser from '@rocket.chat/message-parser';
import type { KeyboardEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import CodeElement from '../code/CodeElement';
import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';

type SpoilerNode = {
	type: 'SPOILER';
	value: MessageBlock[];
};

type MessageBlock =
	| MessageParser.Timestamp
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.Plain
	| MessageParser.Bold
	| MessageParser.Italic
	| MessageParser.Strike
	| MessageParser.InlineCode
	| SpoilerNode;

type SpoilerSpanProps = {
	children: MessageBlock[];
};

const SpoilerSpan = ({ children }: SpoilerSpanProps): ReactElement => {
	const [revealed, setRevealed] = useState(false);

	const toggle = useCallback(() => {
		setRevealed((v) => !v);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLSpanElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggle();
			}
		},
		[toggle],
	);

	const style = useMemo(() => {
		if (revealed) {
			return { cursor: 'pointer' } as const;
		}

		return {
			cursor: 'pointer',
			userSelect: 'none',
			borderRadius: 2,
			paddingInline: 2,
			color: 'transparent',
			backgroundColor: 'currentColor',
		} as const;
	}, [revealed]);

	return (
		<span
			role='button'
			tabIndex={0}
			aria-pressed={revealed}
			aria-label='Reveal spoiler'
			onClick={toggle}
			onKeyDown={onKeyDown}
			style={style}
		>
			{children.map((block, index) => renderBlockComponent(block, index))}
		</span>
	);
};

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
			return <StrikeSpan key={index}>{block.value}</StrikeSpan>;

		case 'ITALIC':
			return <ItalicSpan key={index}>{block.value}</ItalicSpan>;

		case 'BOLD':
			return <BoldSpan key={index}>{block.value}</BoldSpan>;

		case 'INLINE_CODE':
			return <CodeElement key={index} code={block.value.value} />;

		case 'SPOILER':
			return <SpoilerSpan key={index}>{block.value}</SpoilerSpan>;

		default:
			return null;
	}
};

export default SpoilerSpan;
