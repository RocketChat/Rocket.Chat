import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';
import Bold from './Bold';
import InlineCode from './InlineCode';
import Italic from './Italic';
import Link from './Link';
import Mention from './Mention';
import Plain from './Plain';
import Strike from './Strike';
import { UserMention } from './definitions/UserMention';

const Inline: FC<{ value: ASTParagraph['value']; mentions?: UserMention[] }> = ({
	value = [],
	mentions = [],
}) => (
	<>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return block.value;
				case 'BOLD':
					return <Bold value={block.value} key={index} />;
				case 'STRIKE':
					return <Strike value={block.value} key={index} />;
				case 'ITALIC':
					return <Italic value={block.value} key={index} />;
				case 'LINK':
					return <Link value={block.value} key={index} />;
				case 'MENTION_USER':
					return <Mention value={block.value} mentions={mentions} key={index} />;
				case 'EMOJI':
					return <Emoji emojiHandle={`:${block.value.value}:`} key={index} />;
				case 'MENTION_CHANNEL':
					// case 'COLOR':
					return <Plain value={block.value} key={index} />;
				case 'INLINE_CODE':
					return <InlineCode value={block.value} key={index} />;
				default:
					return null;
			}
		})}
	</>
);

export default Inline;
