import { StyleSheet, View, Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import StrikeSpan from './StrikeSpan';
import EmojiSpan from './EmojiSpan';

const styles = StyleSheet.create({
	bold: {
		fontWeight: 700,
	},
});

type BoldSpanProps = {
	children: (
		| MessageParser.Emoji
		| MessageParser.ChannelMention
		| MessageParser.UserMention
		| MessageParser.Link
		| MessageParser.MarkupExcluding<MessageParser.Bold>
	)[];
};

const BoldSpan = ({ children }: BoldSpanProps) => (
	<View style={styles.bold}>
		{children.map((child, index) => {
			switch (child.type) {
				case 'LINK':
					return <LinkSpan key={index} label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]} />;

				case 'PLAIN_TEXT':
					return <Text key={index}>{child.value}</Text>;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

				case 'EMOJI':
					return <EmojiSpan key={index} {...child} />;

				default:
					return null;
			}
		})}
	</View>
);

export default BoldSpan;
