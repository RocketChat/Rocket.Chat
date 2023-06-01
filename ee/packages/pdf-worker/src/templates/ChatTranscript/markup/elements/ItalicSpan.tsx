import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './BoldSpan';
import LinkSpan from './LinkSpan';
import StrikeSpan from './StrikeSpan';
import EmojiSpan from './EmojiSpan';

const styles = StyleSheet.create({
	italic: {
		fontStyle: 'italic',
	},
});

type ItalicSpanProps = {
	children: (
		| MessageParser.Emoji
		| MessageParser.ChannelMention
		| MessageParser.UserMention
		| MessageParser.Link
		| MessageParser.MarkupExcluding<MessageParser.Italic>
	)[];
};

const ItalicSpan = ({ children }: ItalicSpanProps) => (
	<View style={styles.italic}>
		{children.map((child, index) => {
			switch (child.type) {
				case 'LINK':
					return <LinkSpan key={index} label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]} />;

				case 'PLAIN_TEXT':
					return <Text key={index}>{child.value}</Text>;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				case 'EMOJI':
					return <EmojiSpan key={index} {...child} />;

				default:
					return null;
			}
		})}
	</View>
);

export default ItalicSpan;
