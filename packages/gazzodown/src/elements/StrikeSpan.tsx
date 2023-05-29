import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import EmojiElement from '../emoji/EmojiElement';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';
import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';

type StrikeSpanProps = {
	children: (
		| MessageParser.Emoji
		| MessageParser.ChannelMention
		| MessageParser.UserMention
		| MessageParser.Link
		| MessageParser.MarkupExcluding<MessageParser.Strike>
	)[];
};

const StrikeSpan = ({ children }: StrikeSpanProps): ReactElement => (
	<del>
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

				case 'BOLD':
					return <BoldSpan key={index} children={block.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={block.value} />;

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
	</del>
);

export default StrikeSpan;
