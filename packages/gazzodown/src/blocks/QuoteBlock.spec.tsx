import { render, screen } from '@testing-library/react';

import QuoteBlock from './QuoteBlock';

describe('QuoteBlock', () => {
	it('renders blockquote element', () => {
		render(
			<QuoteBlock>
				{[
					{
						type: 'PARAGRAPH',
						value: [{ type: 'PLAIN_TEXT', value: 'Quoted text' }],
					},
				]}
			</QuoteBlock>,
		);
		expect(screen.getByRole('blockquote')).toBeInTheDocument();
		expect(screen.getByText('Quoted text')).toBeInTheDocument();
	});

	it('renders multiple paragraphs', () => {
		render(
			<QuoteBlock>
				{[
					{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'First' }] },
					{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Second' }] },
				]}
			</QuoteBlock>,
		);
		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<QuoteBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Snapshot quote' }] }]}</QuoteBlock>,
		);
		expect(container).toMatchSnapshot();
	});
});
