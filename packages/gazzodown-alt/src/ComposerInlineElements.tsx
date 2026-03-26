import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan';
import ComposerCodeElement from './ComposerCodeElement';
import ComposerColorElement from './ComposerColorElement';
import ComposerEmojiElement from './ComposerEmojiElement';
import ComposerImageElement from './ComposerImageElement';
import ComposerItalicSpan from './ComposerItalicSpan';
import ComposerLinkSpan from './ComposerLinkSpan';
import ComposerMentionChannel from './ComposerMentionChannel';
import ComposerMentionUser from './ComposerMentionUser';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerSpoilerSpan from './ComposerSpoilerSpan';
import ComposerStrikeSpan from './ComposerStrikeSpan';
import ComposerTimestamp from './ComposerTimestamp';

type ComposerInlineElementsProps = {
	children: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[];
};

const flattenMarkupToString = (markup: MessageParser.Markup): string => {
	switch (markup.type) {
		case 'PLAIN_TEXT':
			return markup.value;
		case 'ITALIC':
		case 'BOLD':
		case 'STRIKE':
			return markup.value.map((v) => ('value' in v && typeof v.value === 'string' ? v.value : '')).join('');
		default:
			return '';
	}
};

const ComposerInlineElements = ({ children }: ComposerInlineElementsProps): ReactElement => (
	<>
		{children.map((child, index) => {
			switch (child.type) {
				case 'BOLD':
					return <ComposerBoldSpan key={index}>{child.value}</ComposerBoldSpan>;

				case 'STRIKE':
					return <ComposerStrikeSpan key={index}>{child.value}</ComposerStrikeSpan>;

				case 'ITALIC':
					return <ComposerItalicSpan key={index}>{child.value}</ComposerItalicSpan>;

				case 'SPOILER':
					return <ComposerSpoilerSpan key={index}>{child.value}</ComposerSpoilerSpan>;

				case 'LINK':
					return (
						<ComposerLinkSpan
							key={index}
							href={child.value.src.value}
							label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]}
						/>
					);

				case 'PLAIN_TEXT':
					return <ComposerPlainSpan key={index} text={child.value} />;

				case 'IMAGE':
					return <ComposerImageElement key={index} src={child.value.src.value} alt={flattenMarkupToString(child.value.label)} />;

				case 'MENTION_USER':
					return <ComposerMentionUser key={index} mention={child.value.value} />;

				case 'MENTION_CHANNEL':
					return <ComposerMentionChannel key={index} mention={child.value.value} />;

				case 'INLINE_CODE':
					return <ComposerCodeElement key={index} code={child.value.value} />;

				case 'EMOJI':
					return <ComposerEmojiElement key={index} {...child} />;

				case 'COLOR':
					return <ComposerColorElement key={index} {...child.value} />;

				case 'INLINE_KATEX':
					return <span key={index}>{child.value}</span>;

				case 'TIMESTAMP':
					return <ComposerTimestamp key={index}>{child}</ComposerTimestamp>;

				default: {
					if ('fallback' in child) {
						return <ComposerInlineElements key={index}>{[child.fallback]}</ComposerInlineElements>;
					}
					return null;
				}
			}
		})}
	</>
);

export default ComposerInlineElements;
