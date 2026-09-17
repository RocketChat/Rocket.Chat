import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

const styles = StyleSheet.create({
	wrapper: {
		marginTop: 4,
	},
	list: {
		display: 'flex',
		flexDirection: 'row',
	},
	bullet: {
		marginHorizontal: 4,
	},
});

export type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};
const UnorderedListBlock = ({ items }: UnorderedListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value }, index) => (
			<View style={styles.list} key={index}>
				<Text style={styles.bullet}>•</Text>
				<InlineElements>{value}</InlineElements>
			</View>
		))}
	</View>
);

export default UnorderedListBlock;
