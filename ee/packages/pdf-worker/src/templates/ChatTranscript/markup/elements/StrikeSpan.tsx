import { StyleSheet, View, Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import BoldSpan from './BoldSpan';

const styles = StyleSheet.create({
	strike: {
		textDecoration: 'line-through',
	},
});

type StrikeSpanProps = {
	children: (MessageParser.Link | MessageParser.MarkupExcluding<MessageParser.Strike>)[];
};

const StrikeSpan = ({ children }: StrikeSpanProps) => (
	<View style={styles.strike}>
		{children.map((child, index) => {
			switch (child.type) {
				case 'LINK':
					return <LinkSpan key={index} label={Array.isArray(child.value.label) ? child.value.label : [child.value.label]} />;

				case 'PLAIN_TEXT':
					return <Text key={index}>{child.value}</Text>;

				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

				default:
					return null;
			}
		})}
	</View>
);

export default StrikeSpan;
