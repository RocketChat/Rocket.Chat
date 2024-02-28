import { StyleSheet, View, Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './BoldSpan';
import EmojiSpan from './EmojiSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';

const styles = StyleSheet.create({
	strike: {
		textDecoration: 'line-through',
	},
});

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Strike>
	| MessageParser.InlineCode;

type StrikeSpanProps = {
	children: MessageBlock[];
};

const StrikeSpan = ({ children }: StrikeSpanProps) => (
	<>
		{children.map((child, index) => {
			if (child.type === 'LINK' || child.type === 'PLAIN_TEXT' || child.type === 'ITALIC' || child.type === 'BOLD') {
				return (
					<View style={styles.strike} key={index}>
						{renderBlockComponent(child, index)}
					</View>
				);
			}
			return renderBlockComponent(child, index);
		})}
	</>
);

const renderBlockComponent = (child: MessageBlock, index: number) => {
	switch (child.type) {
		case 'LINK':
			return <LinkSpan key={index} label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]} />;

		case 'PLAIN_TEXT':
			return <Text key={index}>{child.value}</Text>;

		case 'ITALIC':
			return <ItalicSpan key={index} children={child.value} />;

		case 'BOLD':
			return <BoldSpan key={index} children={child.value} />;

		case 'EMOJI':
			return <EmojiSpan key={index} {...child} />;

		default:
			return null;
	}
};

export default StrikeSpan;
