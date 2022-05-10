import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';
import Bold from './Bold';
import Image from './Image';
import InlineCode from './InlineCode';
import Italic from './Italic';
import Link from './Link';
import Mention from './Mention';
import MentionChannel from './MentionChannel';
import PlainText from './PlainText';
import Strike from './Strike';

const Inline: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => (
	<>
		{value.map((block, index) => {
			switch (block.type) {
				case 'IMAGE':
					return <Image key={index} value={block.value} />;
				case 'PLAIN_TEXT':
					return <PlainText key={index} value={block.value} />;
				case 'BOLD':
					return <Bold key={index} value={block.value} />;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'ITALIC':
					return <Italic key={index} value={block.value} />;
				case 'LINK':
					return <Link key={index} value={block.value} />;
				case 'MENTION_USER':
					return <Mention key={index} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <MentionChannel key={index} value={block.value} />;
				case 'EMOJI':
					return <Emoji key={index} emojiHandle={`:${block.value.value}:`} />;
				case 'INLINE_CODE':
					return <InlineCode key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</>
);

export default Inline;
