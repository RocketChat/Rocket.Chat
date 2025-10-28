import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

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

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value, number }, index) => (
			<Text style={styles.list} key={index}>
				<Text style={styles.number}>{number}.</Text> <InlineElements children={value} />
			</Text>
		))}
	</View>
);

export default OrderedListBlock;
