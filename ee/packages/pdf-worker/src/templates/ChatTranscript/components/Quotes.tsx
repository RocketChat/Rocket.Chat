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
		borderTopWidth: 1,
		paddingLeft: 16,
		paddingRight: 16,
	},
	quoteMessage: {
		paddingTop: 6,
		paddingBottom: 6,
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
		<MessageHeader name={quote.name} time={quote.ts} light />
		<View style={styles.quoteMessage}>
			<Markup tokens={quote.md} />
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
