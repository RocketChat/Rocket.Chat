import { View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import { fontScale } from '@rocket.chat/fuselage-tokens/dist/typography.json';
import type { ReactNode } from 'react';

import type { PDFQuote } from '../../../types/ChatTranscriptData';
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
		fontSize: fontScale.p2.fontSize,
	},
});

export type QuoteProps = {
	quote: PDFQuote;
	children: ReactNode;
	index: number;
};

const Quote = ({ quote, children, index }: QuoteProps) => (
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

export default Quote;
