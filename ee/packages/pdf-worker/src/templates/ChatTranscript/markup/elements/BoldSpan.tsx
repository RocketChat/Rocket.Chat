import { StyleSheet, View, Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import EmojiSpan from './EmojiSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import StrikeSpan from './StrikeSpan';

const styles = StyleSheet.create({
	bold: {
		fontWeight: 700,
	},
});

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Bold>
	| MessageParser.InlineCode;

type BoldSpanProps = {
	children: MessageBlock[];
};

const BoldSpan = ({ children }: BoldSpanProps) => (
	<>
		{children.map((child, index) => {
			if (child.type === 'LINK' || child.type === 'PLAIN_TEXT' || child.type === 'ITALIC' || child.type === 'STRIKE') {
				return (
					<View style={styles.bold} key={index}>
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

		case 'STRIKE':
			return <StrikeSpan key={index} children={child.value} />;

		case 'ITALIC':
			return <ItalicSpan key={index} children={child.value} />;

		case 'EMOJI':
			return <EmojiSpan key={index} {...child} />;

		default:
			return null;
	}
};

export default BoldSpan;
