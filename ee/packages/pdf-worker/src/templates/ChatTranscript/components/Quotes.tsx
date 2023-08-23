import { View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

import type { Quote as QuoteType } from '..';
import { Markup } from '../markup';
import { MessageHeader } from './MessageHeader';

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.n100,
		borderWidth: 1,
		borderColor: colors.n250,
		borderLeftColor: colors.n600,
		padding: 16,
		borderTopWidth: 1,
		borderBottomWidth: 1,
	},
	quoteMessage: {
		marginTop: 6,
		fontSize: fontScales.p2.fontSize,
	},
});

const Quote = ({ quote, children, index }: { quote: QuoteType; children: JSX.Element | null; index: number }) => (
	<View
		style={{
			...styles.wrapper,
			marginTop: !index ? 4 : 16,
		}}
	>
		<View>
			<MessageHeader name={quote.name} time={quote.ts} light />
			<View style={styles.quoteMessage}>
				<Markup tokens={quote.md} />
			</View>
		</View>

		{children}
	</View>
);

export const Quotes = ({ quotes }: { quotes: QuoteType[] }) =>
	quotes.reduceRight<JSX.Element | null>(
		(lastQuote, quote, index) => (
			<Quote quote={quote} index={index}>
				{lastQuote}
			</Quote>
		),
		null,
	);
