import type * as MessageParser from '@rocket.chat/message-parser';
import { lazy, ReactElement } from 'react';

import ColorElement from '../colors/ColorElement';
import EmojiElement from '../emoji/EmojiElement';
import KatexErrorBoundary from '../katex/KatexErrorBoundary';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';
import BoldSpan from './BoldSpan';
import ImageElement from './ImageElement';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import Timestamp from './Timestamp';

const CodeElement = lazy(() => import('../code/CodeElement'));
const KatexElement = lazy(() => import('../katex/KatexElement'));

type InlineElementsProps = {
	children: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[];
};

const InlineElements = ({ children }: InlineElementsProps): ReactElement => (
	<>
		{children.map((child, index) => {
			switch (child.type) {
				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

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
					return <Timestamp key={index} children={child} />;
				}

				default: {
					if ('fallback' in child) {
						return <InlineElements key={index} children={[child.fallback]} />;
					}
					return null;
				}
			}
		})}
	</>
);

export default InlineElements;
