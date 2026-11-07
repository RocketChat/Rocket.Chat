import type * as MessageParser from '@rocket.chat/message-parser';
import { Fragment } from 'react';

import BoldSpan from './BoldSpan.js';
import ItalicSpan from './ItalicSpan.js';
import StrikeSpan from './StrikeSpan.js';
import PreviewCodeElement from '../code/PreviewCodeElement.js';
import PreviewColorElement from '../colors/PreviewColorElement.js';
import PreviewEmojiElement from '../emoji/PreviewEmojiElement.js';
import KatexErrorBoundary from '../katex/KatexErrorBoundary.js';
import PreviewKatexElement from '../katex/PreviewKatexElement.js';
import PreviewChannelMentionElement from '../mentions/PreviewChannelMentionElement.js';
import PreviewUserMentionElement from '../mentions/PreviewUserMentionElement.js';

export type PreviewInlineElementsProps = {
	children: MessageParser.Inlines[];
};

const PreviewInlineElements = ({ children }: PreviewInlineElementsProps) => (
	<>
		{children.map((child, index) => {
			switch (child.type) {
				case 'BOLD':
					return <BoldSpan key={index}>{child.value}</BoldSpan>;

				case 'STRIKE':
					return <StrikeSpan key={index}>{child.value}</StrikeSpan>;

				case 'ITALIC':
					return <ItalicSpan key={index}>{child.value}</ItalicSpan>;

				case 'SPOILER':
					return <PreviewInlineElements key={index}>{child.value}</PreviewInlineElements>;

				case 'LINK':
					return (
						<PreviewInlineElements key={index}>
							{Array.isArray(child.value.label) ? child.value.label : [child.value.label]}
						</PreviewInlineElements>
					);

				case 'PLAIN_TEXT':
					return <Fragment key={index}>{child.value}</Fragment>;

				case 'IMAGE':
					return <PreviewInlineElements key={index}>{[child.value.label]}</PreviewInlineElements>;

				case 'MENTION_USER':
					return <PreviewUserMentionElement key={index} mention={child.value.value} />;

				case 'MENTION_CHANNEL':
					return <PreviewChannelMentionElement key={index} mention={child.value.value} />;

				case 'INLINE_CODE':
					return <PreviewCodeElement key={index} code={child.value.value} />;

				case 'EMOJI':
					return <PreviewEmojiElement key={index} {...child} />;

				case 'COLOR':
					return <PreviewColorElement key={index} {...child.value} />;

				case 'INLINE_KATEX':
					return (
						<KatexErrorBoundary key={index} code={child.value}>
							<PreviewKatexElement code={child.value} />
						</KatexErrorBoundary>
					);

				default:
					return null;
			}
		})}
	</>
);

export default PreviewInlineElements;
