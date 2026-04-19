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
	nested: {
		marginLeft: 16,
	},
});

type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};
const UnorderedListBlock = ({ items }: UnorderedListBlockProps) => (
	<View style={styles.wrapper} wrap>
		{items.map(({ value, children }, index) => (
			<View key={index}>
				<View style={styles.list}>
					<Text style={styles.bullet}>•</Text>
					<InlineElements>{value}</InlineElements>
				</View>
				{children?.length && (
					<View style={styles.nested}>
						<UnorderedListBlock items={children} />
					</View>
				)}
			</View>
		))}
	</View>
);

export default UnorderedListBlock;
