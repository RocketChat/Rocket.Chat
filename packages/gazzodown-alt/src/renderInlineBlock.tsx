import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan';
import ComposerCodeElement from './ComposerCodeElement';
import ComposerEmojiElement from './ComposerEmojiElement';
import ComposerItalicSpan from './ComposerItalicSpan';
import ComposerLinkSpan from './ComposerLinkSpan';
import ComposerMentionChannel from './ComposerMentionChannel';
import ComposerMentionUser from './ComposerMentionUser';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerSpoilerSpan from './ComposerSpoilerSpan';
import ComposerStrikeSpan from './ComposerStrikeSpan';

export const renderInlineBlock = (block: MessageParser.Inlines, index: number): ReactElement | null => {
	switch (block.type) {
		case 'BOLD':
			return <ComposerBoldSpan key={index}>{block.value}</ComposerBoldSpan>;

		case 'ITALIC':
			return <ComposerItalicSpan key={index}>{block.value}</ComposerItalicSpan>;

		case 'STRIKE':
			return <ComposerStrikeSpan key={index}>{block.value}</ComposerStrikeSpan>;

		case 'SPOILER':
			return <ComposerSpoilerSpan key={index}>{block.value}</ComposerSpoilerSpan>;

		case 'LINK':
			return <ComposerLinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

		case 'PLAIN_TEXT':
			return <ComposerPlainSpan key={index} text={block.value} />;

		case 'MENTION_USER':
			return <ComposerMentionUser key={index} mention={block.value.value} />;

		case 'MENTION_CHANNEL':
			return <ComposerMentionChannel key={index} mention={block.value.value} />;

		case 'INLINE_CODE':
			return <ComposerCodeElement key={index} code={block.value.value} />;

		case 'EMOJI':
			return <ComposerEmojiElement key={index} {...block} />;

		default:
			return null;
	}
};
