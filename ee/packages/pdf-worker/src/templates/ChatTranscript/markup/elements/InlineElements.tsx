import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './BoldSpan';
import CodeSpan from './CodeSpan';
import EmojiSpan from './EmojiSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import StrikeSpan from './StrikeSpan';

type InlineElementsProps = {
	children: MessageParser.Inlines[];
};

const InlineElements = ({ children }: InlineElementsProps) => (
	<Text>
		{children.map((child, index) => {
			switch (child.type) {
				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

				case 'LINK':
					return <LinkSpan key={index} label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]} />;

				case 'PLAIN_TEXT':
					return <Text key={index}>{child.value}</Text>;

				case 'EMOJI':
					return <EmojiSpan key={index} {...child} />;

				case 'INLINE_CODE':
					return <CodeSpan key={index} code={child.value.value} />;

				case 'MENTION_USER':
				case 'MENTION_CHANNEL':
					return <Text key={index}>{child.value?.value}</Text>;

				default:
					return null;
			}
		})}
	</Text>
);

export default InlineElements;
