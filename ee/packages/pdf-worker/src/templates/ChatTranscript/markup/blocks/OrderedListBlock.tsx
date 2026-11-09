import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import NestedListsBlock from './NestedListsBlock';
import InlineElements from '../elements/InlineElements';

const styles = StyleSheet.create({
	wrapper: {
		marginTop: 4,
	},
	list: {
		flexDirection: 'row',
	},
	number: {
		fontWeight: 700,
		marginHorizontal: 4,
	},
});

export type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value, number, nested }, index) => (
			<View key={index}>
				<Text style={styles.list}>
					<Text style={styles.number}>{number}.</Text> <InlineElements>{value}</InlineElements>
				</Text>
				{nested && <NestedListsBlock lists={nested} />}
			</View>
		))}
	</View>
);

export default OrderedListBlock;
