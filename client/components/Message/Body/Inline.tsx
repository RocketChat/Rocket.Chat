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
		{value.map((block, idx) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return block.value;
				case 'BOLD':
					return <Bold key={idx} value={block.value} />;
				case 'STRIKE':
					return <Strike key={idx} value={block.value} />;
				case 'ITALIC':
					return <Italic key={idx} value={block.value} />;
				case 'LINK':
					return <Link key={idx} value={block.value} />;
				case 'MENTION_USER':
					return <Mention key={idx} value={block.value} mentions={mentions} />;
				case 'EMOJI':
					return <Emoji key={idx} emojiHandle={`:${block.value.value}:`} />;
				case 'MENTION_CHANNEL':
					// case 'COLOR':
					return <Plain key={idx} value={block.value} />;
				case 'INLINE_CODE':
					return <InlineCode key={idx} value={block.value} />;
				default:
					return null;
			}
		})}
	</>
);

export default Inline;
