import type { ReactNode } from 'react';

import Quote from './Quote.js';
import type { PDFQuote } from '../../../types/ChatTranscriptData.js';

export type QuotesProps = {
	quotes: PDFQuote[];
};

const Quotes = ({ quotes }: QuotesProps) =>
	quotes.reduceRight<ReactNode>(
		(lastQuote, quote, index) => (
			<Quote quote={quote} index={index}>
				{lastQuote}
			</Quote>
		),
		null,
	);

export default Quotes;
