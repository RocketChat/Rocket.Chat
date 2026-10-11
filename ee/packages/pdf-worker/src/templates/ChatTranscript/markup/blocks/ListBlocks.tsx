import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import { isOrderedListRun, splitListItemRuns } from './splitListItemRuns';
import InlineElements from '../elements/InlineElements';

const styles = StyleSheet.create({
	wrapper: {
		marginTop: 4,
	},
	list: {
		flexDirection: 'row',
	},
	unorderedList: {
		display: 'flex',
		flexDirection: 'row',
	},
	number: {
		fontWeight: 700,
		marginHorizontal: 4,
	},
	bullet: {
		marginHorizontal: 4,
	},
	nested: {
		marginLeft: 16,
	},
});

type ListBlockProps = {
	items: MessageParser.ListItem[];
};

const NestedLists = ({ items }: { items: MessageParser.ListItem[] }) => (
	<>
		{splitListItemRuns(items).map((run, index) => (
			<View key={index} style={styles.nested}>
				{isOrderedListRun(run) ? <OrderedListBlock items={run} /> : <UnorderedListBlock items={run} />}
			</View>
		))}
	</>
);

export const OrderedListBlock = ({ items }: ListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value, number, children }, index) => (
			<View key={index}>
				<Text style={styles.list}>
					<Text style={styles.number}>{number}.</Text> <InlineElements>{value}</InlineElements>
				</Text>
				{children?.length ? <NestedLists items={children} /> : null}
			</View>
		))}
	</View>
);

export const UnorderedListBlock = ({ items }: ListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value, children }, index) => (
			<View key={index}>
				<View style={styles.unorderedList}>
					<Text style={styles.bullet}>•</Text>
					<InlineElements>{value}</InlineElements>
				</View>
				{children?.length ? <NestedLists items={children} /> : null}
			</View>
		))}
	</View>
);
