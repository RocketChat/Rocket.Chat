import type * as MessageParser from '@rocket.chat/message-parser';
import { lazy } from 'react';

import BoldSpan from './BoldSpan.js';
import ImageElement from './ImageElement.js';
import ItalicSpan from './ItalicSpan.js';
import LinkSpan from './LinkSpan.js';
import PlainSpan from './PlainSpan.js';
import SpoilerSpan from './SpoilerSpan.js';
import StrikeSpan from './StrikeSpan.js';
import Timestamp from './Timestamp/index.js';
import CodeElement from '../code/CodeElement.js';
import ColorElement from '../colors/ColorElement.js';
import EmojiElement from '../emoji/EmojiElement.js';
import KatexErrorBoundary from '../katex/KatexErrorBoundary.js';
import ChannelMentionElement from '../mentions/ChannelMentionElement.js';
import UserMentionElement from '../mentions/UserMentionElement.js';

const KatexElement = lazy(() => import('../katex/KatexElement.js'));

export type InlineElementsProps = {
	children: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[];
};

const InlineElements = ({ children }: InlineElementsProps) => (
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
					return <SpoilerSpan key={index}>{child.value}</SpoilerSpan>;

				case 'LINK':
					return (
						<LinkSpan
							key={index}
							href={child.value.src.value}
							label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]}
						/>
					);

				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={child.value} />;

				case 'IMAGE':
					return <ImageElement key={index} src={child.value.src.value} alt={child.value.label} />;

				case 'MENTION_USER':
					return <UserMentionElement key={index} mention={child.value.value} />;

				case 'MENTION_CHANNEL':
					return <ChannelMentionElement key={index} mention={child.value.value} />;

				case 'INLINE_CODE':
					return <CodeElement key={index} code={child.value.value} />;

				case 'EMOJI':
					return <EmojiElement key={index} {...child} />;

				case 'COLOR':
					return <ColorElement key={index} {...child.value} />;

				case 'INLINE_KATEX':
					return (
						<KatexErrorBoundary key={index} code={child.value}>
							<KatexElement code={child.value} />
						</KatexErrorBoundary>
					);

				case 'TIMESTAMP': {
					return <Timestamp key={index}>{child}</Timestamp>;
				}

				default: {
					if ('fallback' in child) {
						return <InlineElements key={index}>{[child.fallback]}</InlineElements>;
					}
					return null;
				}
			}
		})}
	</>
);

export default InlineElements;
