import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import BoldSpan from './BoldSpan';
import ChannelMentionElement from './ChannelMentionElement';
import CodeElement from './CodeElement';
import ColorElement from './ColorElement';
import EmojiElement from './EmojiElement';
import ImageElement from './ImageElement';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import UserMentionElement from './UserMentionElement';

type InlineElementsProps = {
	children: MessageParser.Inlines[];
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
					return <LinkSpan key={index} href={child.value.src.value} label={child.value.label} />;

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
					return <EmojiElement key={index} handle={child.value.value} />;

				case 'COLOR':
					return <ColorElement key={index} {...child.value} />;

				default:
					return null;
			}
		})}
	</>
);

export default InlineElements;
