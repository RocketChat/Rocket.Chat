import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './elements/BoldSpan';
import ChannelMentionElement from './elements/ChannelMentionElement';
import CodeElement from './elements/CodeElement';
import ColorElement from './elements/ColorElement';
import EmojiElement from './elements/EmojiElement';
import ImageElement from './elements/ImageElement';
import ItalicSpan from './elements/ItalicSpan';
import LinkSpan from './elements/LinkSpan';
import PlainSpan from './elements/PlainSpan';
import SpoilerSpan from './elements/SpoilerSpan';
import StrikeSpan from './elements/StrikeSpan';
import Timestamp from './elements/Timestamp';
import UserMentionElement from './elements/UserMentionElement';

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
					return <PlainSpan key={index} text={child.value} />;

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
