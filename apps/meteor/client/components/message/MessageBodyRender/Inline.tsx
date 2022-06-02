import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import MessageEmoji from '../MessageEmoji';
import InlineCode from './InlineCode';
import Mention from './Mention';
import MentionChannel from './MentionChannel';
import { useMessageBodyIsThreadPreview } from './contexts/MessageBodyContext';
import BoldSpan from './elements/BoldSpan';
import ImageElement from './elements/ImageElement';
import ItalicSpan from './elements/ItalicSpan';
import LinkSpan from './elements/LinkSpan';
import PlainSpan from './elements/PlainSpan';
import StrikeSpan from './elements/StrikeSpan';

const Inline: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => {
	const isThreadPreview = useMessageBodyIsThreadPreview();
	return (
		<>
			{value.map((block, index) => {
				switch (block.type) {
					case 'BOLD':
						return <BoldSpan key={index} children={block.value} />;

					case 'STRIKE':
						return <StrikeSpan key={index} children={block.value} />;

					case 'ITALIC':
						return <ItalicSpan key={index} children={block.value} />;

					case 'LINK':
						return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

					case 'PLAIN_TEXT':
						return <PlainSpan key={index} text={block.value} />;

					case 'IMAGE':
						return <ImageElement key={index} src={block.value.src.value} alt={block.value.label} />;

					case 'MENTION_USER':
						return <Mention key={index} value={block.value} />;

					case 'MENTION_CHANNEL':
						return <MentionChannel key={index} value={block.value} />;

					case 'EMOJI':
						return <MessageEmoji isThreadPreview={isThreadPreview} key={index} handle={block.value.value} />;

					case 'INLINE_CODE':
						return <InlineCode key={index} value={block.value} />;

					default:
						return null;
				}
			})}
		</>
	);
};

export default Inline;
