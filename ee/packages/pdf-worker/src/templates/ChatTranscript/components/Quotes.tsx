import { View, StyleSheet } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

import type { Quote } from '..';
import { MessageHeader } from './MessageHeader';
import { Markup } from '../markup';

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.n100,
		borderWidth: 1,
		borderColor: colors.n250,
		borderLeftColor: colors.n600,
		paddingBottom: 16,
		marginTop: 4,
	},
	quote: {
		padding: 16,
	},
	quoteMessage: {
		marginTop: 6,
		fontSize: fontScales.p2.fontSize,
	},
	nestedQuote: {
		borderWidth: 1,
		borderColor: colors.n250,
		borderLeftColor: colors.n600,
		marginHorizontal: 16,
		paddingBottom: 16,
	},
});

export const Quotes = ({ quotes }: { quotes: Quote[] }) => (
	<View style={styles.wrapper}>
		{quotes?.map((quote, index) => {
			const hasNestedQuote = quotes[index + 1];
			let nestedComponents = (
				<View style={{ ...styles.quote, paddingBottom: hasNestedQuote ? 16 : 0 }}>
					<MessageHeader name={quote.name} time={quote.ts} light />
					<View style={styles.quoteMessage}>
						<Markup tokens={quote.md} />
					</View>
				</View>
			);
			for (let i = 0; i < index; i++) {
				const isEven = i % 2 === 0;
				nestedComponents = (
					<View
						style={{
							...styles.nestedQuote,
							borderBottomWidth: hasNestedQuote ? 0 : 1,
							borderTopWidth: isEven ? 1 : 0,
						}}
					>
						{nestedComponents}
					</View>
				);
			}
			return <View key={index}>{nestedComponents}</View>;
		})}
	</View>
);
