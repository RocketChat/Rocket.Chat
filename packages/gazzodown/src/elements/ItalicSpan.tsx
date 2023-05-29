import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';
import BoldSpan from './BoldSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type ItalicSpanProps = {
	children: (
		| MessageParser.Emoji
		| MessageParser.ChannelMention
		| MessageParser.UserMention
		| MessageParser.Link
		| MessageParser.MarkupExcluding<MessageParser.Italic>
	)[];
};

const ItalicSpan = ({ children }: ItalicSpanProps): ReactElement => (
	<em>
		{children.map((block, index) => {
			switch (block.type) {
				case 'LINK':
					return (
						<LinkSpan
							key={index}
							href={block.value.src.value}
							label={Array.isArray(block.value.label) ? block.value.label : [block.value.label]}
						/>
					);

				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={block.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={block.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={block.value} />;

				case 'MENTION_USER':
					return <UserMentionElement key={index} mention={block.value.value} />;

				case 'MENTION_CHANNEL':
					return <ChannelMentionElement key={index} mention={block.value.value} />;

				case 'EMOJI':
					return <EmojiElement key={index} {...block} />;

				default:
					return null;
			}
		})}
	</em>
);

export default ItalicSpan;
