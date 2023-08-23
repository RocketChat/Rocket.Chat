import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import BoldSpan from './BoldSpan';
import EmojiSpan from './EmojiSpan';
import LinkSpan from './LinkSpan';
import StrikeSpan from './StrikeSpan';

const styles = StyleSheet.create({
	italic: {
		fontStyle: 'italic',
	},
});

type MessageBlock =
	| MessageParser.Emoji
	| MessageParser.ChannelMention
	| MessageParser.UserMention
	| MessageParser.Link
	| MessageParser.MarkupExcluding<MessageParser.Italic>;

type ItalicSpanProps = {
	children: MessageBlock[];
};

const ItalicSpan = ({ children }: ItalicSpanProps) => (
	<>
		{children.map((child, index) => {
			if (child.type === 'LINK' || child.type === 'PLAIN_TEXT' || child.type === 'STRIKE' || child.type === 'BOLD') {
				return (
					<View style={styles.italic} key={index}>
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

		case 'BOLD':
			return <BoldSpan key={index} children={child.value} />;

		case 'EMOJI':
			return <EmojiSpan key={index} {...child} />;

		default:
			return null;
	}
};

export default ItalicSpan;
