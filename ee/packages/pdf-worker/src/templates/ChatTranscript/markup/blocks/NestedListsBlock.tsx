import { StyleSheet, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import { Markup } from '..';

const styles = StyleSheet.create({
	wrapper: {
		marginLeft: 12,
	},
});

type NestedListsBlockProps = {
	lists: MessageParser.NestedList[];
};

const NestedListsBlock = ({ lists }: NestedListsBlockProps) => (
	<View style={styles.wrapper}>
		<Markup tokens={lists} />
	</View>
);

export default NestedListsBlock;
